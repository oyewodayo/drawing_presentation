class TextTool extends ShapeTool {
	constructor() {
		super();
		this.lastClickedText = null;
		this.lastClickTime = 0;
		this.doubleClickThreshold = 300;
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

		const startPosition = new Vector(e.offsetX, e.offsetY);
		const startPositionCtxScale = startPosition.scale(window.devicePixelRatio);

		// Hit test to find if clicking on an existing text shape
		const [r, g, b, a] = viewport.hitTestLayer.ctx.getImageData(
			startPositionCtxScale.x,
			startPositionCtxScale.y,
			1,
			1
		).data;

		const id = (r << 16) | (g << 8) | b;
		const existingShape = viewport.getShapes().find((s) => s.id == id);

		// If clicking on existing text shape
		if (existingShape && existingShape.isText && existingShape.isText()) {
			const currentTime = Date.now();

			// Unselect other shapes
			viewport.getShapes().forEach((s) => {
				if (s !== existingShape) {
					s.unselect(false);
				}
			});

			// Check for double-click on the same text
			if (
				this.lastClickedText === existingShape &&
				currentTime - this.lastClickTime < this.doubleClickThreshold
			) {
				// Double-click detected - enter edit mode
				existingShape.enterEditMode();
				this.lastClickedText = null;
				this.lastClickTime = 0;
			} else {
				// Single click - select the text
				if (!existingShape.selected) {
					existingShape.select();
				}
				this.lastClickedText = existingShape;
				this.lastClickTime = currentTime;
			}
			return;
		}

		// Otherwise, create new text at click position
		const mousePosition = viewport.getAdjustedPosition(Vector.fromOffsets(e));

		// Unselect all other shapes
		viewport.getShapes().forEach((s) => s.unselect(false));

		// Reset text tool state
		this.lastClickedText = null;
		this.lastClickTime = 0;

		// Create new text with placeholder
		const text = new Text(mousePosition, propertiesPanel.getValues());
		viewport.addShapes(text);

		// Select the text shape
		text.select();

		// Enter edit mode with blinking cursor
		setTimeout(() => {
			if (text.editor) {
				Cursor.enterEditMode(
					viewport.editorLayer.canvas,
					text.editor,
					-1,
					0
				);

				text.editor.recordTextChange();
			}
		}, 10);
	}
}