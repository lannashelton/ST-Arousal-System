import { getContext, extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

export const MODULE_NAME = 'arousal_system';

console.log("[ArousalSystem] Starting extension loading...");

function getCurrentCharacter() {
    const context = getContext();
    return context.characters[context.characterId] || null;
}

async function initializeExtension() {
    try {
        const { ArousalManager } = await import("./src/ArousalManager.js");
        const { ArousalPanel } = await import("./src/ArousalPanel.js");

        const manager = new ArousalManager();
        const panel = new ArousalPanel(manager);

        function registerSlashCommand() {
            const context = getContext();
            context.registerSlashCommand('arousal', async () => {
                const character = getCurrentCharacter();
                if (!character) {
                    toastr.info("Please select a character first");
                    return;
                }
                panel.toggle();
            }, [], 'Toggle arousal system panel', true, true);
        }

        function updateCharacter() {
            try {
                const character = getCurrentCharacter();
                if (!character) {
                    return;
                }
                manager.setCharacter(character);
                panel.updateCharacter(character.name);
            } catch (error) {
                console.error("Character update failed", error);
            }
        }

        function setupEventListeners() {
            const { eventSource, event_types } = getContext();

            eventSource.on(event_types.CHAT_CHANGED, updateCharacter);
            eventSource.on(event_types.CHARACTER_CHANGED, updateCharacter);
            eventSource.on(event_types.APP_READY, updateCharacter);

            // Process activities after character messages
            eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, () => {
                setTimeout(() => {
                    const character = getCurrentCharacter();
                    if (!character) return;
                    
                    const message = manager.processAroual();
                    console.debug(`[Arousal] Processing arousal: ${message || "No message"}`);
                    
                    if (message && extension_settings[MODULE_NAME]?.enableSysMessages) {
                        panel.sendSystemMessage(message);
                    }
                    
                    panel.updateIfVisible();
                }, 0);
            });
        }

        function initSettings() {
            extension_settings[MODULE_NAME] = extension_settings[MODULE_NAME] || {
                enableSysMessages: true
            };
        }

        function createSettingsUI() {
            const settingsHtml = `
            <div class="arousal-extension-settings">
                <div class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>Arousal Settings</b>
                        <div class="inline-drawer-icon down"></div>
                    </div>
                    <div class="inline-drawer-content">
                        <div class="flex-container" style="margin-bottom: 10px;">
                            <label for="arousal-sys-toggle" style="flex-grow: 1;">System messages</label>
                            <input type="checkbox" id="arousal-sys-toggle" ${extension_settings[MODULE_NAME].enableSysMessages ? 'checked' : ''}>
                        </div>
                    </div>
                </div>
            </div>`;

            $("#extensions_settings").append(settingsHtml);

            $("#arousal-sys-toggle").on("input", function() {
                extension_settings[MODULE_NAME].enableSysMessages = $(this).prop('checked');
                saveSettingsDebounced();
            });
        }

        initSettings();
        registerSlashCommand();
        setupEventListeners();
        createSettingsUI();
        updateCharacter();

    } catch (error) {
        console.error("Arousal init error", error);
    }
}

$(document).ready(() => {
    initializeExtension();
});
