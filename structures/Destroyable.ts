class Destroyable {
    constructor() {};

    destroy() {
        Object.keys(this).forEach(key => this[key] = null);
    }
}

export default Destroyable;