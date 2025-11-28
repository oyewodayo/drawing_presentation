class TextTool extends ShapeTool {
	constructor() {
		super();
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

		const mousePosition = viewport.getAdjustedPosition(Vector.fromOffsets(e));

		// Create text with placeholder and immediately enter edit mode
		const text = new Text(mousePosition, propertiesPanel.getValues());
		viewport.addShapes(text);

		// Select the text shape
		text.select();

		// Enter edit mode with blinking cursor
		setTimeout(() => {
			if (text.editor) {
				// Enter edit mode at the beginning of the text
				Cursor.enterEditMode(
					viewport.editorLayer.canvas,
					text.editor,
					-1,
					0
				);

				// Record the initial text change for undo/redo
				text.editor.recordTextChange();
			}
		}, 10);
	}
}