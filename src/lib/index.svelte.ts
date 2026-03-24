// Tree
export class Checklist {
    public constructor() { }

    // Only root_.sublist is used.
    private root_: ChecklistItem = new ChecklistItem(null);

    // Runtime data, no need for persistance.
    private dragged_item_: ChecklistItem | null = null;
    private dragged_dest_: { dest_item: ChecklistItem; is_up: boolean; } | null = null;
    private dragover_cnt_: number = 0;

    public get root() { return this.root_; }
    set root(value) { this.root_ = value; }
    public get dragged_item() { return this.dragged_item_; }
    set dragged_item(value) { this.dragged_item_ = value; }
    public get dragged_dest() { return this.dragged_dest_; }
    set dragged_dest(value) { this.dragged_dest_ = value; }
    public get dragover_cnt() { return this.dragover_cnt_; }
    set dragover_cnt(value) { this.dragover_cnt_ = value; }
}

interface ChecklistItemJSON {
    id_: string,
    text_: string,
    completed_: boolean,
    sublist_: ChecklistItemJSON[],
    expanded_: boolean,
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
            sublist_: this.sublist_.map((e) => e.toJSON()),
            expanded_: this.expanded_
        }
        return json
    }

    static fromJSON(json: ChecklistItemJSON, parent: ChecklistItem | null): ChecklistItem {
        const item = new ChecklistItem(parent);
        item.id_ = json.id_;
        item.text_ = json.text_;
        item.completed_ = json.completed_;
        item.sublist_ = json.sublist_.map((e) => ChecklistItem.fromJSON(e, item));
        item.expanded_ = json.expanded_;
        return item;
    }

    public propagate_completed() {
        // Up
        let parent = this.parent_;
        while (parent) {
            parent.completed_ = parent.sublist_.every((e) => e.completed_);
            parent = parent.parent_;
        }

        // Down
        const propagate_down = (item: ChecklistItem) => {
            item.sublist.forEach(
                (e) => {
                    e.completed_ = item.completed_;
                    propagate_down(e);
                }
            );
        }
        propagate_down(this);
    }

    private id_: string = crypto.randomUUID();
    private text_: string = $state("");
    private completed_: boolean = $state(false);
    private parent_: ChecklistItem | null;
    private sublist_: ChecklistItem[] = $state([]);
    private expanded_: boolean = $state(true);

    public get id() { return this.id_; }
    public get text() { return this.text_; }
    public set text(value) { this.text_ = value; }
    public get completed() { return this.completed_; }
    public set completed(value) { this.completed_ = value; }
    public get parent() { return this.parent_; }
    public get sublist() { return this.sublist_; }
    public get expanded() { return this.expanded_; }
    public set expanded(value) { this.expanded_ = value; }
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
        this.is_dirty_ = false;
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

    public mark_dirty() {
        this.is_dirty_ = true;
    }

    private storage_: Storage | null = null;
    private checklist_: Checklist = new Checklist();
    private is_dirty_: boolean = $state(false);

    public get checklist() { return this.checklist_; }
    public get is_dirty() { return this.is_dirty_; }
}
