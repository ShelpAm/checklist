// Tree
export class Checklist {
    public constructor() { }

    // Only root_.sublist is used.
    private root_: ChecklistItem = new ChecklistItem(null);

    public get root() { return this.root_; }
    set root(value) { this.root_ = value; }
}

interface ChecklistItemJSON {
    id_: string,
    text_: string,
    completed_: boolean,
    sublist_: ChecklistItemJSON[]
}

export class ChecklistItem {
    public constructor(parent: ChecklistItem | null, text?: string) {
        this.text_ = text || "";
        this.parent_ = parent;
    }

    public toJSON() {
        const json: ChecklistItemJSON = {
            id_: this.id_,
            text_: this.text_,
            completed_: this.completed_,
            sublist_: this.sublist_.map((e) => e.toJSON())
        }
        return json
    }

    static fromJSON(json: ChecklistItemJSON, parent: ChecklistItem | null): ChecklistItem {
        const item = new ChecklistItem(parent);
        item.id_ = json.id_;
        item.text_ = json.text_;
        item.completed_ = json.completed_;
        item.sublist_ = json.sublist_.map((e) => ChecklistItem.fromJSON(e, item));
        return item;
    }

    private id_: string = crypto.randomUUID();
    private text_: string = $state("");
    private completed_: boolean = $state(false);
    private parent_: ChecklistItem | null;
    private sublist_: ChecklistItem[] = $state([]);

    public get id() { return this.id_; }
    public get text() { return this.text_; }
    public set text(value) { this.text_ = value; }
    public get completed() { return this.completed_; }
    public set completed(value) { this.completed_ = value; }
    public get parent() { return this.parent_; }
    public get sublist() { return this.sublist_; }
}

export class ChecklistSynchronizer {
    public constructor(storage: Storage | null = null) {
        this.load_from(storage);
    }

    public save() {
        if (!this.storage_) {
            console.warn("Storage is null, cannot save checklist.");
            return;
        }

        console.log("Saving checklist to storage:", this.checklist);
        this.storage_?.setItem("checklist", JSON.stringify(this.checklist));
    }

    public load_from(storage: Storage | null): void {
        this.storage_ = storage;
        if (!this.storage_) {
            console.warn("Storage is null, using in-memory checklist.");
            this.checklist_ = new Checklist();
            return;
        }

        const list = this.storage_.getItem("checklist");
        if (!list) {
            console.log("No checklist found, initializing with empty checklist.");
            this.checklist_ = new Checklist();
            return;
        }

        console.log("Checklist loaded from storage:", list);
        this.checklist_.root = ChecklistItem.fromJSON(JSON.parse(list).root_, null);
        console.log("Checklist deserialized from json:", this.checklist_);
    }

    private storage_: Storage | null = null;
    private checklist_: Checklist = new Checklist();
    public get checklist() {
        return this.checklist_;
    }
}
