class Text extends Shape {
	constructor(center, options) {
		super(options);
		this.center = center;

		this.editor = new TextEditor(center, options)
		this.editor.onchange = this.handleEditorChange
		this.editor.onempty = () => {
			this.selected = true;
			delete this.editor
			viewport.deleteShapes([this]);
		}

		this.lastClickTime = 0;
        this.clickTimeout = null;
        this.doubleClickThreshold = 300;

		this.setText("Enter Text Here", false);
	}

	

	static load(data) {
		const center = Vector.load(data.center)
		const options = JSON.parse(JSON.stringify(data.options));
		const text = new Text(center, options);
		text.id = data.id;
		text.editor.properties = JSON.parse(
			JSON.stringify({ ...text.properties, ...data?.properties })
		);
		text.editor.size = data.size;
		text.selected = data.selected;
		text.editor.text = data.text;
		text.rotation = data.rotation ?? 0;
		return text;
	}

	handleEditorChange() {
		viewport.dispatchEvent(
			new CustomEvent("textChanged", { detail: { shape: this } })
		);
	}

	serialize() {
		return {
			type: "Text",
			id: this.id,
			options: JSON.parse(JSON.stringify(this.options)),
			center: this.center,
			size: JSON.parse(JSON.stringify(this.editor.size)),
			text: this.editor.text,
			selected: this.selected,
			rotation: this.rotation,
			properties: this.editor.properties,
		};
	}

	getPoints() {
		let size = this.editor.size
		return [
			new Vector(-size.width / 2, -size.height / 2),
			new Vector(-size.width / 2, size.height / 2),
			new Vector(size.width / 2, size.height / 2),
			new Vector(size.width / 2, -size.height / 2),
		];
	}

	_setWidth(width) {
		//do nothing
	}

	_setHeight(height) {
		//do nothing
	}

	setText(value, save = true) {
		this.editor.setText(value)
	}

	setFontSize(value, save = true) {
		this.editor.setFontSize(value)
		viewport.dispatchEvent(
			new CustomEvent("textChanged", { detail: { shape: this, save } })
		);
	}

	setAlignment(value, save = true) {
		this.editor.setAlignment(value)
		viewport.dispatchEvent(
			new CustomEvent("textChanged", { detail: { shape: this, save } })
		);
	}

	getFontSize() {
		return this.editor.getFontSize();
	}

	getAlignment() {
		return this.editor.getAlignment();
	}

	getWidth() {
		return this.editor.size.width;
	}

	getHeight() {
		return this.editor.size.height;
	}

	click() {
        if (Cursor.isEditing) {
            return;
        }

        const currentTime = Date.now();
        
        // Clear any pending single-click timeout
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }

        // Check for double-click
        if (currentTime - this.lastClickTime < this.doubleClickThreshold) {
            // Double-click detected - enter edit mode immediately
            this.enterEditMode();
            return; // Exit early to prevent selection logic
        } else {
            // Single click - start timer
            this.lastClickTime = currentTime;
            this.clickTimeout = setTimeout(() => {
                // Only select if we're not already selected, or toggle selection
                if (this.selected) {
                    this.unselect();
                } else {
                    this.select();
                }
                this.clickTimeout = null;
            }, this.doubleClickThreshold);
        }
    }
	enterEditMode(startPosition = null) {
        if (!this.editor) return;
        
        // Clear any pending click timeout when entering edit mode
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }
        
        // Get click position in text coordinates
        let row = 0;
        let index = 0;
        
        if (startPosition) {
            [row, index] = this.editor.getRowOfLineAndIndexAtPoint(startPosition);
        } else {
            // If no start position provided, start at the beginning
            index = -1;
            row = 0;
        }
        
        // Enter edit mode at clicked position
        Cursor.enterEditMode(
            viewport.editorLayer.canvas, 
            this.editor, 
            index, 
            row
        );
        
        // Reset click tracking
        this.lastClickTime = 0;
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }
        
        // Record text change for undo/redo
        if (this.editor) {
            this.editor.recordTextChange();
        }
    }



	isText() {
		return true
	}

	attemptToEnterEditMode(startPosition) {
        // This method is no longer needed as we handle edit mode in click()
        // Keep it for backward compatibility but make it a no-op
        return;
    }

	unselect(save = true) {
		this.numberClicked = 0;
		this.selected = false;
		this.gizmo = null;
		TextHighlight.reset()

		viewport.dispatchEvent(
			new CustomEvent("shapeUnselected", {
				detail: { shape: this, save },
			})
		);
	}

	getRowOfLineAndIndexAtPoint(point) {
		return this.editor.getRowOfLineAndIndexAtPoint(point)
	}

	setRotation(angle, save = true) {
		this.editor.rotation = angle
		super.setRotation(angle, save)
	}

	setOptions(options, save = true) {
		this.editor.options = { ...this.editor.options, ...options }
		super.setOptions(options, save)
	}

	setCenter(center, save = true) {
		this.editor.center = center
		super.setCenter(center, save)
	}


	draw(ctx, hitRegion = false) {
		if (hitRegion) {
			ctx.save()
			let boxes = this.editor.getLinesBoxes()
			boxes.forEach((box) => {
				let { left, top, width, height } = box
				ctx.beginPath();
				ctx.rect(left, top, width, height);
				this.applyHitRegionStyles(ctx)
			})
			ctx.restore()
		} else {
			this.editor.draw(ctx)
		}
	}
}

ShapeFactory.registerShape(Text, "Text");
