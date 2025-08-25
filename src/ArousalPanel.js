export class ArousalPanel {
    constructor(manager) {
        this.manager = manager;
        this.isVisible = false;
        this.domElement = null;
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'arousal-panel';
        
        panel.innerHTML = `
            <div class="draggable-header">
                <h3>Arousal System</h3>
                <div>
                    <span id="arousal-refresh-btn" style="cursor: pointer; margin-left: 10px; font-size: 1.2em;">↻</span>
                    <span id="arousal-close-btn" style="cursor: pointer; margin-left: 10px; font-size: 1.2em;">×</span>
                </div>
            </div>
            <div class="content">
                <div class="parts-selector">
                    <button data-part="breasts" class="part-btn">Breasts</button>
                    <button data-part="nipples" class="part-btn">Nipples</button>
                    <button data-part="vagina" class="part-btn">Vagina</button>
                    <button data-part="clitoris" class="part-btn">Clitoris</button>
                    <button data-part="g-spot" class="part-btn">G-Spot</button>
                    <button data-part="anal" class="part-btn">Anal</button>
                    <button data-part="penis" class="part-btn">Penis</button>
                    <button data-part="prostate" class="part-btn">Prostate</button>
                </div>
                
                <div class="progress-section">
                    <div class="header">
                        <span>Arousal Level:</span>
                        <span id="arousal-text">0%</span>
                    </div>
                    <div class="progress-container">
                        <div id="arousal-bar" class="progress-fill"></div>
                        <div class="progress-text">0%</div>
                    </div>
                </div>
                
                <div style="margin-top: 15px; text-align: center;">
                    Successive Orgasm Count: <span id="orgasm-count">0</span>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        return panel;
    }

    makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = element.querySelector('.draggable-header');

        if (header) {
            header.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    updateButtonStates() {
        if (!this.domElement) return;
        const buttons = this.domElement.querySelectorAll('.part-btn');
        
        buttons.forEach(btn => {
            const part = btn.dataset.part;
            if (this.manager.state.activeParts[part]) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    update() {
        if (!this.domElement || !this.manager.character) return;
        
        // Update arousal display
        const arousalBar = this.domElement.querySelector('#arousal-bar');
        const arousalText = this.domElement.querySelector('#arousal-text');
        const barText = this.domElement.querySelector('.progress-text');
        const orgasmCount = this.domElement.querySelector('#orgasm-count');
        
        if (arousalBar) {
            arousalBar.style.width = `${this.manager.state.arousal}%`;
        }
        if (arousalText) {
            arousalText.textContent = `${Math.round(this.manager.state.arousal)}%`;
        }
        if (barText) {
            barText.textContent = `${Math.round(this.manager.state.arousal)}%`;
        }
        if (orgasmCount) {
            orgasmCount.textContent = this.manager.state.orgasmCount;
        }
        
        // Update button states
        this.updateButtonStates();
    }

    bindEvents() {
        // Part buttons
        this.domElement.querySelectorAll('.part-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.manager.togglePart(btn.dataset.part);
                this.update();
            });
        });
        
        // Close button
        this.domElement.querySelector('#arousal-close-btn').addEventListener('click', () => {
            this.isVisible = false;
            this.domElement.style.display = 'none';
        });
        
        // Refresh button
        this.domElement.querySelector('#arousal-refresh-btn').addEventListener('click', () => {
            this.manager.loadState();
            toastr.info('Arousal stats reloaded');
            this.update();
        });
    }

    updateCharacter(name) {
        if (!this.domElement) return;
        const header = this.domElement.querySelector('.draggable-header h3');
        if (header) header.textContent = `Arousal: ${name}`;
        this.update();
    }

    toggle() {
        if (!this.domElement) {
            this.domElement = this.createPanel();
            this.makeDraggable(this.domElement);
            this.bindEvents();
            this.update();
        }
        
        this.isVisible = !this.isVisible;
        this.domElement.style.display = this.isVisible ? 'block' : 'none';
        
        if (this.isVisible && this.manager.character) {
            this.update();
        }
    }

    updateIfVisible() {
        if (this.isVisible && this.domElement) {
            this.update();
        }
    }

    sendSystemMessage(message) {
        try {
            const chatInput = document.getElementById('send_textarea');
            if (!chatInput) return;
            
            chatInput.value = `/sys ${message}`;
            
            const sendButton = document.querySelector('#send_but');
            if (sendButton) {
                sendButton.click();
            } else {
                chatInput.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    bubbles: true
                }));
            }
        } catch (error) {
            console.error("Failed to send system message:", error);
        }
    }
}
