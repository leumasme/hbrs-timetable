// import tristateStyle from "./tristate.css" with { type: "css" };
// Firefox does not support this syntax       ^^^^ Do we care?

// Alternative solution, but less elegant:
const tristateStyle = new CSSStyleSheet();
await tristateStyle.replace(await fetch("tristate.css").then(r => r.text()))

class TriStateItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.shadowRoot.adoptedStyleSheets = [tristateStyle];

        const item = document.createElement("div");
        item.className = "item";

        // Button to expand children
        const toggleBtn = document.createElement("button");
        toggleBtn.className = "toggle-btn";
        toggleBtn.textContent = "▶";
        toggleBtn.onclick = () => this.toggleChildren();
        item.appendChild(toggleBtn);
        this._toggleBtn = toggleBtn;

        // The actual checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.onclick = (e) => {
            this.handleCheckboxClick();
            e.stopPropagation();
        };
        this._checkbox = checkbox;
        // The checkbox will be put inside the label element, so it will be implicitly associated with the label
        // Clicking the label will then toggle the checkbox

        // Label for the item
        const label = document.createElement("label");
        label.appendChild(checkbox);
        // The text inside the label
        const labelText = document.createTextNode("");
        label.appendChild(labelText);
        item.appendChild(label);
        this._labelText = labelText;

        this.shadowRoot.appendChild(item);

        // Container for slotted in TriStateItem children
        const childrenContainer = document.createElement("div");
        childrenContainer.className = "children";
        childrenContainer.appendChild(document.createElement("slot"));
        this.shadowRoot.appendChild(childrenContainer);
        this._childrenContainer = childrenContainer;

    }

    /** Overwrite - required for attributeChangedCallback to work */
    static get observedAttributes() {
        return ["label"];
    }

    /** Overwrite - called when an attribute of the element changes */
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "label") {
            this._labelText.textContent = newValue;
        }
    }

    get checked() {
        return this._checkbox.checked;
    }
    set checked(value) {
        this._checkbox.checked = value;
    }

    get indeterminate() {
        return this._checkbox.indeterminate;
    }
    set indeterminate(value) {
        this._checkbox.indeterminate = value;
    }

    /** Toggle whether the children list is expanded or not */
    toggleChildren() {
        this._childrenContainer.classList.toggle("expanded");
        // TODO: Maybe use SVG/Icon instead of a character?
    }

    /** Update Parents and Children based on this elements own checked state */
    handleCheckboxClick() {
        const isChecked = this.checked;

        // Update all child checkboxes
        for (const child of this.querySelectorAll("tri-state-item")) {
            child.checked = isChecked;
            child.indeterminate = false;
        }

        // Notify parent to update its state
        if (this.parentElement instanceof TriStateItem) {
            this.parentElement.refreshState();
        }
    }

    /**
     * Calculate and update own element's checkbox state based on its children's states.
     * Called by children when their state changes.
     */
    refreshState() {
        const children = Array.from(this.children).filter(el => el instanceof TriStateItem);

        const checkedCount = children.filter(child => child.checked).length;
        const indeterminateCount = children.filter(child => child.indeterminate).length;
        const totalCount = children.length;

        if (checkedCount === 0 && indeterminateCount === 0) {
            this.checked = false;
            this.indeterminate = false;
        } else if (checkedCount === totalCount) {
            this.checked = true;
            this.indeterminate = false;
        } else {
            this.checked = false;
            this.indeterminate = true;
        }

        // Update parent state as well
        if (this.parentElement instanceof TriStateItem) {
            this.parentElement.refreshState();
        }
    }
}

// Register the custom element
customElements.define("tri-state-item", TriStateItem);

export { }