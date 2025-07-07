class TextTool extends ShapeTool {
	constructor() {
		super();
		this.lastClickTime = 0;
		this.clickTimeout = null;
		this.doubleClickThreshold = 300; // milliseconds
	}

	getShortcut() {
		return new Shortcut({
			control: false,
			key: "t",
			action: () => CanvasTools.selectTool("Text"),
		});
	}

	addPointerDownListener(e) {
		if (e.button !== 0) return;

		const currentTime = Date.now();
		const mousePosition = viewport.getAdjustedPosition(Vector.fromOffsets(e));

		// Clear any pending single-click timeout
		if (this.clickTimeout) {
			clearTimeout(this.clickTimeout);
			this.clickTimeout = null;
		}

		// Check for double-click
		if (currentTime - this.lastClickTime < this.doubleClickThreshold) {
			// Double-click detected - create text and enter edit mode immediately
			this.createTextAndEnterEditMode(mousePosition);
		} else {
			// Single click - start timer for potential double-click
			this.lastClickTime = currentTime;
			this.clickTimeout = setTimeout(() => {
				// Single click confirmed - create text normally
				this.createTextNormally(mousePosition);
				this.clickTimeout = null;
			}, this.doubleClickThreshold);
		}
	}

	createTextAndEnterEditMode(mousePosition) {
		const text = new Text(mousePosition, propertiesPanel.getValues());
		viewport.addShapes(text);
		
		// Select the text shape
		text.select();
		
		// Enter edit mode immediately with blinking cursor
		// We need to wait a frame for the text to be properly rendered and added
		setTimeout(() => {
			if (text.editor) {
				// Enter edit mode at the beginning of the text
				Cursor.enterEditMode(
					viewport.editorLayer.canvas,
					text.editor,
					-1, // Start at beginning of text
					0   // First line
				);
				
				// Record the initial text change for undo/redo
				text.editor.recordTextChange();
			}
		}, 10);
		
		// Reset click tracking
		this.lastClickTime = 0;
	}

	createTextNormally(mousePosition) {
		const text = new Text(mousePosition, propertiesPanel.getValues());
		viewport.addShapes(text);
		// Reset click tracking
		this.lastClickTime = 0;
	}

	// Override the removeEventListeners to clean up timeouts
	removeEventListeners() {
		super.removeEventListeners();
		if (this.clickTimeout) {
			clearTimeout(this.clickTimeout);
			this.clickTimeout = null;
		}
	}
}