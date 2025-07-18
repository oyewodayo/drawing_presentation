const SHOW_HIT_REGIONS = false;
const RECTANGULAR_SELECTION_MODE = "intersection"; // or "containment"

// Calculate stage dimensions based on window size
const STAGE_PROPERTIES = {
	width: window.innerWidth,
	height: window.innerHeight,
	backgroundColor: "#ffffff", // Default white background
};

const viewport = new Viewport(canvasHolder, STAGE_PROPERTIES, SHOW_HIT_REGIONS);

const propertiesPanel = new PropertiesPanel(propertiesHolder);
const toolsPanel = new ToolsPanel(toolsHolder);

// Handle window resize to update stage dimensions
window.addEventListener('resize', () => {
	const newWidth = window.innerWidth;
	const newHeight = window.innerHeight;
	
	// Update stage properties
	STAGE_PROPERTIES.width = newWidth;
	STAGE_PROPERTIES.height = newHeight;
	STAGE_PROPERTIES.left = -newWidth / 2;
	STAGE_PROPERTIES.top = -newHeight / 2;
	
	// Resize the stage
	resizeStage(newWidth, newHeight);
	
	// Update viewport canvas dimensions
	viewport.canvasWidth = newWidth;
	viewport.canvasHeight = newHeight;
	
	// Resize all layers
	viewport.layers.forEach(layer => {
		const pixelRatio = window.devicePixelRatio;
		layer.canvas.style.width = newWidth + "px";
		layer.canvas.style.height = newHeight + "px";
		layer.canvas.width = Math.floor(newWidth * pixelRatio);
		layer.canvas.height = Math.floor(newHeight * pixelRatio);
		layer.canvas.unscaledWidth = newWidth;
		layer.canvas.unscaledHeight = newHeight;
		layer.ctx.scale(pixelRatio, pixelRatio);
		
		// Update zero center offset
		layer.zeroCenterOffset = new Vector(newWidth / 2, newHeight / 2);
		layer.ctx.translate(layer.zeroCenterOffset.x, layer.zeroCenterOffset.y);
	});
	
	// Resize overlay and editor layers
	[viewport.overlayLayer, viewport.editorLayer, viewport.hitTestLayer].forEach(layer => {
		const pixelRatio = window.devicePixelRatio;
		layer.canvas.style.width = newWidth + "px";
		layer.canvas.style.height = newHeight + "px";
		layer.canvas.width = Math.floor(newWidth * pixelRatio);
		layer.canvas.height = Math.floor(newHeight * pixelRatio);
		layer.canvas.unscaledWidth = newWidth;
		layer.canvas.unscaledHeight = newHeight;
		layer.ctx.scale(pixelRatio, pixelRatio);
		
		// Update zero center offset
		layer.zeroCenterOffset = new Vector(newWidth / 2, newHeight / 2);
		layer.ctx.translate(layer.zeroCenterOffset.x, layer.zeroCenterOffset.y);
	});
	
	// Update stage layer
	const pixelRatio = window.devicePixelRatio;
	viewport.stageLayer.canvas.style.width = newWidth + "px";
	viewport.stageLayer.canvas.style.height = newHeight + "px";
	viewport.stageLayer.canvas.width = Math.floor(newWidth * pixelRatio);
	viewport.stageLayer.canvas.height = Math.floor(newHeight * pixelRatio);
	viewport.stageLayer.canvas.unscaledWidth = newWidth;
	viewport.stageLayer.canvas.unscaledHeight = newHeight;
	viewport.stageLayer.ctx.scale(pixelRatio, pixelRatio);
	
	// Update zero center offset for stage layer
	viewport.stageLayer.zeroCenterOffset = new Vector(newWidth / 2, newHeight / 2);
	viewport.stageLayer.ctx.translate(viewport.stageLayer.zeroCenterOffset.x, viewport.stageLayer.zeroCenterOffset.y);
	
	// Update viewport zero center offset
	viewport.zeroCenterOffset = new Vector(newWidth / 2, newHeight / 2);
	
	// Redraw everything
	viewport.drawShapes();
});