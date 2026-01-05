/* SPARK FRAMEWORK v0.6 - The "Pro" Upgrade */
(function() {
    class SparkComponent {
        constructor() { this.state = {}; this.styles = ""; }
        _makeReactive(key, val) {
            let _val = val;
            const self = this;
            Object.defineProperty(this.state, key, {
                get() { return _val; },
                set(newVal) { _val = newVal; self._updateUI(); }
            });
        }
        _mount(id) {
            this.container = document.getElementById(id);
            if (!this.container) return;
            window.$activeApp = this;
            if(this.styles) {
                const s = document.createElement('style');
                s.innerHTML = this.styles;
                document.head.appendChild(s);
            }
            this._updateUI();
        }
        _updateUI() {
            if (this.container) {
                this.container.innerHTML = this.render();
                // Magic: Link inputs with s-model back to state
                this.container.querySelectorAll('[s-model]').forEach(el => {
                    const prop = el.getAttribute('s-model');
                    el.value = this.state[prop] || "";
                    el.oninput = (e) => { this.state[prop] = e.target.value; };
                });
            }
        }
    }
    window.SparkComponent = SparkComponent;

    function compile(src) {
        let js = src
            .replace(/component\s+(\w+)\s*\{/g, 'class $1 extends SparkComponent { constructor() { super(); this._init(); } _init() {')
            // NEW: style { ... } block
            .replace(/style\s*\{([\s\S]*?)\}/g, 'this.styles = `$1`;')
            .replace(/view\s*\{/g, '} render() { return `')
            .replace(/\}\s*$/g, '`; } }')
            .replace(/state\s+(\w+)\s*=\s*(.+)/g, 'this._makeReactive("$1", $2);')
            // Logic Tags
            .replace(/\{each\s+(\w+)\s+as\s+(\w+)\}/g, '${ this.state.$1.map($2 => `')
            .replace(/\{endeach\}/g, '`).join("") }')
            .replace(/\{if\s+(.*?)\}/g, '${ this.state.$1 ? `')
            .replace(/\{endif\}/g, '` : "" }')
            // Variable Interp
            .replace(/\{(\w+)\}/g, '${this.state.$1 !== undefined ? this.state.$1 : $1}')
            // Event Handling
            .replace(/on(\w+)="(.*?)"/g, (m, event, code) => {
                let fix = code.replace(/([a-zA-Z0-9_]+)(?=\+\+|--|=)/g, 'window.$activeApp.state.$1');
                return `on${event}="${fix}; window.$activeApp._updateUI()"`;
            });
        return js;
    }

    // Auto-Navigation Listener (from v0.5)
    document.addEventListener("click", (e) => {
        const targetId = e.target.getAttribute("go-to");
        if (targetId) document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
    });

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll('script[type="text/spark"]').forEach(s => {
            eval(compile(s.innerHTML) + "\n new App()._mount('root');");
        });
    });
})();
