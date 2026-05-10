(function () {
    const { PluginApi } = window;
    
    // Konvertera DataURL till Blob
    function dataURItoBlob(dataURI) {
        var byteString = atob(dataURI.split(',')[1]);
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], {type: mimeString});
    }

    // Hämta plugin-inställningar
    async function getPluginSettings() {
        const query = `
            query {
                plugins {
                    id
                    name
                    enabled
                    settings
                }
            }`;
        try {
            const resp = await PluginApi.GQL.query(query);
            if (resp && resp.data && resp.data.plugins) {
                const myPlugin = resp.data.plugins.find(p => p.name === "Auto Tagger" || p.id === "auto-tagger");
                if (myPlugin && myPlugin.settings) {
                    console.log("Hittade plugin-inställningar:", myPlugin.settings);
                    return myPlugin.settings;
                }
            }
        } catch (e) {
            console.error("Kunde inte hämta plugin-inställningar via GQL:", e);
        }
        return {};
    }

    // GraphQL Mutation för att skapa en tagg om den inte finns
    async function getOrCreateTag(tagName) {
        // Först, sök om taggen finns
        const query = `
            query FindTags($filter: FindFilterType, $tag_filter: TagFilterType) {
                findTags(filter: $filter, tag_filter: $tag_filter) {
                    tags { id name }
                }
            }`;
        const variables = {
            filter: { q: tagName, per_page: 1 },
            tag_filter: { name: { value: tagName, modifier: "EQUALS" } }
        };
        
        try {
            const resp = await PluginApi.GQL.query(query, variables);
            const tags = resp.data.findTags.tags;
            if (tags && tags.length > 0) {
                return tags[0].id;
            }
        } catch(e) { console.error(e); }

        // Om den inte finns, skapa den
        const createMutation = `
            mutation TagCreate($input: TagCreateInput!) {
                tagCreate(input: $input) { id name }
            }`;
        try {
            const createResp = await PluginApi.GQL.mutate(createMutation, { input: { name: tagName } });
            return createResp.data.tagCreate.id;
        } catch(e) {
            console.error("Kunde inte skapa tagg:", tagName, e);
            return null;
        }
    }

    // GraphQL Mutation för att lägga till taggar på en scen
    async function addTagsToScene(sceneId, newTagIds) {
        // Hämta befintliga taggar först
        const query = `query FindScene($id: ID!) { findScene(id: $id) { tags { id } } }`;
        try {
            const resp = await PluginApi.GQL.query(query, { id: sceneId });
            const existingTagIds = resp.data.findScene.tags.map(t => t.id);
            
            // Slå ihop och ta bort dubbletter
            const finalTagIds = Array.from(new Set([...existingTagIds, ...newTagIds]));
            
            const mutate = `mutation SceneUpdate($input: SceneUpdateInput!) { sceneUpdate(input: $input) { id } }`;
            await PluginApi.GQL.mutate(mutate, { input: { id: sceneId, tag_ids: finalTagIds } });
            
            // Ladda om sidan eller scen-datan för att reflektera ändringarna
            window.location.reload();
        } catch(e) {
            console.error("Kunde inte uppdatera scen:", e);
        }
    }

    function showTagsModal(sceneId, tags) {
        const overlay = document.createElement('div');
        overlay.className = 'auto-tagger-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'auto-tagger-modal';
        
        const title = document.createElement('h2');
        title.innerText = 'Föreslagna Taggar (JoyTag)';
        modal.appendChild(title);
        
        const info = document.createElement('p');
        info.innerText = 'Klicka på de taggar du vill spara på scenen:';
        modal.appendChild(info);
        
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'auto-tagger-tags';
        
        const selectedTags = new Set();
        
        tags.forEach(tag => {
            const tEl = document.createElement('div');
            tEl.className = 'auto-tagger-tag';
            tEl.innerText = tag;
            tEl.onclick = () => {
                if (selectedTags.has(tag)) {
                    selectedTags.delete(tag);
                    tEl.classList.remove('selected');
                } else {
                    selectedTags.add(tag);
                    tEl.classList.add('selected');
                }
            };
            tagsContainer.appendChild(tEl);
        });
        
        modal.appendChild(tagsContainer);
        
        const actions = document.createElement('div');
        actions.className = 'auto-tagger-actions';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-cancel';
        cancelBtn.innerText = 'Avbryt';
        cancelBtn.onclick = () => document.body.removeChild(overlay);
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-save';
        saveBtn.innerText = 'Spara valda taggar';
        saveBtn.onclick = async () => {
            saveBtn.innerText = 'Sparar...';
            saveBtn.disabled = true;
            
            const tagIds = [];
            for (const tagName of selectedTags) {
                const tId = await getOrCreateTag(tagName);
                if (tId) tagIds.push(tId);
            }
            
            if (tagIds.length > 0) {
                await addTagsToScene(sceneId, tagIds);
            }
            document.body.removeChild(overlay);
        };
        
        actions.appendChild(cancelBtn);
        actions.appendChild(saveBtn);
        modal.appendChild(actions);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    async function analyzeFrame() {
        const video = document.querySelector('video');
        if (!video) {
            alert("Hittade ingen video att analysera!");
            return;
        }

        // Hämta inställningar
        const settings = await getPluginSettings();
        const apiUrl = settings.api_url || "http://192.168.0.140:5000";
        const timeout = (settings.api_timeout || 60) * 1000;
        const minConf = settings.min_confidence || 0.2;

        // Pausa videon
        video.pause();

        // Extrahera Scene ID från URL (t.ex. /scenes/123)
        const match = window.location.pathname.match(/\/scenes\/(\d+)/);
        if (!match) {
            alert("Du måste vara på en scen-sida.");
            return;
        }
        const sceneId = match[1];

        // Ta skärmdump via canvas
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const blob = dataURItoBlob(dataUrl);

        const formData = new FormData();
        formData.append('image', blob, 'frame.jpg');

        // Visa laddningsindikator
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'auto-tagger-modal-overlay';
        loadingOverlay.innerHTML = '<div class="auto-tagger-modal"><h2>Analyserar bild...</h2><p>Väntar på svar från JoyTag via Go-API...</p></div>';
        document.body.appendChild(loadingOverlay);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/tag_suggest`, {
                method: "POST",
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            document.body.removeChild(loadingOverlay);

            if (!response.ok) {
                throw new Error("API-fel: " + response.statusText);
            }

            const result = await response.json();
            if (result.tags && result.tags.length > 0) {
                // Filtrera baserat på konfidens om API:et returnerar det (StashAPI Go returnerar just nu bara en lista med strängar)
                // Om vi vill ha mer avancerad filtrering får vi uppdatera Go-API:et också.
                showTagsModal(sceneId, result.tags);
            } else {
                alert("JoyTag hittade inga taggar.");
            }
        } catch (e) {
            if (document.body.contains(loadingOverlay)) {
                document.body.removeChild(loadingOverlay);
            }
            console.error(e);
            let msg = e.name === 'AbortError' ? "Analysen tog för lång tid (timeout)." : e.message;
            alert(`Ett fel uppstod vid kontakt med API:et på ${apiUrl}\n\n` + msg);
        }
    }

    // Injektera knapp i Stash UI när vi navigerar till en scen
    function injectButton() {
        // Kontrollera om vi är på en scensida
        if (!window.location.pathname.includes('/scenes/')) return;
        
        // Kontrollera om knappen redan finns
        if (document.getElementById('auto-tagger-button')) return;

        // Försök hitta videokontrollerna
        // Stash använder olika klasser för kontrollerna, vi kan lägga den bredvid andra knappar i spelaren
        const controlBar = document.querySelector('.vjs-control-bar') || document.querySelector('.player-controls');
        if (controlBar) {
            const btn = document.createElement('button');
            btn.id = 'auto-tagger-button';
            btn.className = 'auto-tagger-btn vjs-control vjs-button';
            btn.title = "Auto-Tag (JoyTag)";
            // Enkel trollstav-ikon SVG
            btn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M7.5,5.6L5,7L6.4,4.5L5,2L7.5,3.4L10,2L8.6,4.5L10,7L7.5,5.6M19.5,15.4L22,14L20.6,16.5L22,19L19.5,17.6L17,19L18.4,16.5L17,14L19.5,15.4M22,2L20.6,4.5L22,7L19.5,5.6L17,7L18.4,4.5L17,2L19.5,3.4L22,2M13.34,12.78L15.78,10.34L13.66,8.22L11.22,10.66L13.34,12.78M14.37,7.29L16.71,9.63C17.1,10 17.1,10.65 16.71,11.04L5.04,22.71C4.65,23.1 4,23.1 3.63,22.71L1.29,20.37C0.9,20 0.9,19.35 1.29,18.96L12.96,7.29C13.35,6.9 14,6.9 14.37,7.29Z" />
            </svg>`;
            btn.onclick = analyzeFrame;
            
            // Lägg till i början eller slutet av kontrollraden
            controlBar.appendChild(btn);
        }
    }

    // Lyssna på URL-ändringar (eftersom Stash är en SPA)
    let lastUrl = location.href; 
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(injectButton, 1000);
        }
        // Ibland renderas videospelaren sent, så vi provar också injektera om den saknas
        if (window.location.pathname.includes('/scenes/') && !document.getElementById('auto-tagger-button')) {
            injectButton();
        }
    }).observe(document, {subtree: true, childList: true});

    // Initial körning
    setTimeout(injectButton, 1000);

})();
