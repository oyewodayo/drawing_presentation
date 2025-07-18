class Path extends Shape {
	constructor(startPoint, options) {
		super(options);
		this.points = [startPoint];
		this.rawPoints = [startPoint]; // Store original points for smoothing
		this.smoothedPoints = [startPoint]; // Store smoothed points
		this.smoothingFactor = 0.3; // Smoothing intensity (0-1)
		this.minDistance = 1; // Minimum distance between points
	}

	static load(data) {
		const path = new Path();
		path.id = data.id;

		path.center = Vector.load(data.center);
		path.size = data.size;
		path.options = JSON.parse(JSON.stringify(data.options));

		path.points = data.points.map((p) => Vector.load(p));

		path.rotation = data.rotation ?? 0;
		path.rawPoints = data.rawPoints ? data.rawPoints.map((p) => Vector.load(p)) : path.points;
		path.smoothedPoints = path.points;

		path.selected = data.selected;

		return path;
	}

	serialize() {
		return {
			type: "Path",
			id: this.id,
			center: this.center,
			size: JSON.parse(JSON.stringify(this.size)),
			points: JSON.parse(JSON.stringify(this.points)),
			options: JSON.parse(JSON.stringify(this.options)),
			rotation: this.rotation,
			rawPoints: JSON.parse(JSON.stringify(this.rawPoints)),
			selected: this.selected,
		};
	}

	addPoint(point) {
		const lastRawPoint = this.rawPoints[this.rawPoints.length - 1];
		
		// Only add point if it's far enough from the last point
		if (!lastRawPoint || Vector.distance(lastRawPoint, point) > this.minDistance) {
			this.rawPoints.push(point);
			this.smoothPath();
		}
	}

	smoothPath() {
		if (this.rawPoints.length < 3) {
			this.points = [...this.rawPoints];
			this.smoothedPoints = [...this.rawPoints];
			return;
		}

		// Apply Catmull-Rom spline smoothing
		this.smoothedPoints = this.applyCatmullRomSmoothing(this.rawPoints);
		this.points = this.smoothedPoints;
	}

	applyCatmullRomSmoothing(points) {
		if (points.length < 3) return points;

		const smoothed = [points[0]]; // Keep first point
		
		for (let i = 1; i < points.length - 1; i++) {
			const p0 = points[i - 1] || points[i];
			const p1 = points[i];
			const p2 = points[i + 1] || points[i];
			const p3 = points[i + 2] || points[i + 1];

			// Generate intermediate points using Catmull-Rom spline
			const segments = 4; // Number of segments between each point
			for (let t = 0; t < segments; t++) {
				const u = t / segments;
				const smoothPoint = this.catmullRomInterpolate(p0, p1, p2, p3, u);
				smoothed.push(smoothPoint);
			}
		}

		smoothed.push(points[points.length - 1]); // Keep last point
		return smoothed;
	}

	catmullRomInterpolate(p0, p1, p2, p3, t) {
		const t2 = t * t;
		const t3 = t2 * t;

		const x = 0.5 * (
			(2 * p1.x) +
			(-p0.x + p2.x) * t +
			(2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
			(-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
		);

		const y = 0.5 * (
			(2 * p1.y) +
			(-p0.y + p2.y) * t +
			(2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
			(-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
		);

		return new Vector(x, y);
	}

	getPoints() {
		return this.points;
	}

	setPoints(points) {
		this.points = points;
	}

	_setWidth(newWidth) {
		const box = BoundingBox.fromPoints(this.points);
		let flip = 1;

		flip = Math.sign(newWidth) !== Math.sign(this.size.width) ? -1 : 1;
		const eps = 0.0001;
		if (box.width == 0) {
			console.error("Size 0 problem!");
		}
		let width = box.width == 0 ? eps : box.width;

		const ratio = (flip * Math.abs(newWidth)) / width;

		for (const point of this.points) {
			point.x *= ratio;
		}
		this.size.width = newWidth;
	}

	_setHeight(newHeight) {
		const box = BoundingBox.fromPoints(this.points);
		let flip = 1;

		flip = Math.sign(newHeight) !== Math.sign(this.size.height) ? -1 : 1;

		const eps = 0.0001;
		if (box.height == 0) {
			console.error("Size 0 problem!");
		}
		const height = box.height == 0 ? eps : box.height;
		const ratio = (flip * Math.abs(newHeight)) / height;
		for (const point of this.points) {
			point.y *= ratio;
		}
		this.size.height = newHeight;
	}

	draw(ctx, hitRegion = false) {
		const center = this.center ? this.center : { x: 0, y: 0 };
		
		if (this.points.length < 2) return;

		ctx.save();
		
		if (!hitRegion) {
			// Apply smooth line settings
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
		}

		ctx.beginPath();
		
		if (this.points.length === 2) {
			// Simple line for two points
			ctx.moveTo(this.points[0].x + center.x, this.points[0].y + center.y);
			ctx.lineTo(this.points[1].x + center.x, this.points[1].y + center.y);
		} else {
			// Use quadratic curves for smooth drawing
			ctx.moveTo(this.points[0].x + center.x, this.points[0].y + center.y);
			
			for (let i = 1; i < this.points.length - 1; i++) {
				const currentPoint = this.points[i];
				const nextPoint = this.points[i + 1];
				
				// Calculate control point (midpoint between current and next)
				const controlX = (currentPoint.x + nextPoint.x) / 2;
				const controlY = (currentPoint.y + nextPoint.y) / 2;
				
				ctx.quadraticCurveTo(
					currentPoint.x + center.x,
					currentPoint.y + center.y,
					controlX + center.x,
					controlY + center.y
				);
			}
			
			// Draw to the last point
			const lastPoint = this.points[this.points.length - 1];
			ctx.lineTo(lastPoint.x + center.x, lastPoint.y + center.y);
		}
		
		if (hitRegion) {
			this.applyHitRegionStyles(ctx);
		} else {
			this.applyStyles(ctx);
		}
		
		ctx.restore();
	}
}

ShapeFactory.registerShape(Path, "Path");
