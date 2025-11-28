class Path extends Shape {
	constructor(startPoint, options) {
		super(options);
		this.points = [startPoint];
		this.rawPoints = [startPoint]; // Store original points for smoothing
		this.smoothedPoints = [startPoint]; // Store smoothed points
		this.smoothingFactor = 0.2; // Light smoothing for natural look
		this.minDistance = 2.5; // Optimal distance between points
		this.isDrawing = false; // Flag to control when to apply smoothing
		this.velocitySmoothing = 0.3; // For velocity-based smoothing
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

	// Start drawing mode (minimal smoothing during drawing)
	startDrawing() {
		this.isDrawing = true;
	}

	// End drawing mode (apply final smoothing)
	endDrawing() {
		this.isDrawing = false;
		this.smoothPath();
	}

	addPoint(point) {
		const lastRawPoint = this.rawPoints[this.rawPoints.length - 1];

		// Only add point if it's far enough from the last point
		if (!lastRawPoint || Vector.distance(lastRawPoint, point) > this.minDistance) {
			this.rawPoints.push(point);

			// Apply real-time smoothing for immediate feedback
			if (this.rawPoints.length >= 3) {
				this.points = this.applyRealTimeSmoothing(this.rawPoints);
			} else {
				this.points = [...this.rawPoints];
			}
		}
	}

	smoothPath() {
		if (this.rawPoints.length < 3) {
			this.points = [...this.rawPoints];
			this.smoothedPoints = [...this.rawPoints];
			return;
		}

		// Apply final smoothing with slightly more refinement
		this.smoothedPoints = this.applyFinalSmoothing(this.rawPoints);
		this.points = this.smoothedPoints;
	}

	applyRealTimeSmoothing(points) {
		if (points.length < 3) return points;

		const smoothed = [points[0]];

		// Very light smoothing during drawing for responsive feel
		for (let i = 1; i < points.length - 1; i++) {
			const prev = points[i - 1];
			const current = points[i];
			const next = points[i + 1];

			// Minimal smoothing: 15% influence from neighbors
			const smoothX = prev.x * 0.15 + current.x * 0.7 + next.x * 0.15;
			const smoothY = prev.y * 0.15 + current.y * 0.7 + next.y * 0.15;

			smoothed.push(new Vector(smoothX, smoothY));
		}

		smoothed.push(points[points.length - 1]);
		return smoothed;
	}

	applyFinalSmoothing(points) {
		if (points.length < 3) return points;

		const smoothed = [points[0]];

		// Two-pass smoothing for natural human-like curves
		let firstPass = [];
		for (let i = 0; i < points.length; i++) {
			if (i === 0 || i === points.length - 1) {
				firstPass.push(points[i]);
			} else {
				const prev = points[i - 1];
				const current = points[i];
				const next = points[i + 1];

				// First pass: light smoothing
				const smoothX = prev.x * 0.2 + current.x * 0.6 + next.x * 0.2;
				const smoothY = prev.y * 0.2 + current.y * 0.6 + next.y * 0.2;

				firstPass.push(new Vector(smoothX, smoothY));
			}
		}

		// Second pass: very subtle smoothing for natural flow
		for (let i = 1; i < firstPass.length - 1; i++) {
			const prev = firstPass[i - 1];
			const current = firstPass[i];
			const next = firstPass[i + 1];

			const smoothX = prev.x * 0.15 + current.x * 0.7 + next.x * 0.15;
			const smoothY = prev.y * 0.15 + current.y * 0.7 + next.y * 0.15;

			smoothed.push(new Vector(smoothX, smoothY));
		}

		smoothed.push(firstPass[firstPass.length - 1]);
		return smoothed;
	}

	// Keep the Catmull-Rom method as an alternative for when you need more smoothing
	applyCatmullRomSmoothing(points) {
		if (points.length < 3) return points;

		const smoothed = [points[0]]; // Keep first point
		
		for (let i = 1; i < points.length - 1; i++) {
			const p0 = points[i - 1] || points[i];
			const p1 = points[i];
			const p2 = points[i + 1] || points[i];
			const p3 = points[i + 2] || points[i + 1];

			// Reduced segments to prevent over-smoothing
			const segments = 2; // Reduced from 4
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
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
		}

		ctx.beginPath();

		if (this.points.length === 2) {
			// Simple line for two points
			ctx.moveTo(this.points[0].x + center.x, this.points[0].y + center.y);
			ctx.lineTo(this.points[1].x + center.x, this.points[1].y + center.y);
		} else {
			// Start at the first point
			ctx.moveTo(this.points[0].x + center.x, this.points[0].y + center.y);

			// Use quadratic Bezier curves for smooth, natural strokes
			for (let i = 0; i < this.points.length - 2; i++) {
				const currentPoint = this.points[i];
				const nextPoint = this.points[i + 1];
				const afterNext = this.points[i + 2];

				// Control point is the current next point
				// End point is the midpoint between next and afterNext
				const endX = (nextPoint.x + afterNext.x) / 2;
				const endY = (nextPoint.y + afterNext.y) / 2;

				ctx.quadraticCurveTo(
					nextPoint.x + center.x,
					nextPoint.y + center.y,
					endX + center.x,
					endY + center.y
				);
			}

			// Handle the last two points
			if (this.points.length > 2) {
				const secondLast = this.points[this.points.length - 2];
				const last = this.points[this.points.length - 1];

				ctx.quadraticCurveTo(
					secondLast.x + center.x,
					secondLast.y + center.y,
					last.x + center.x,
					last.y + center.y
				);
			}
		}

		if (hitRegion) {
			this.applyHitRegionStyles(ctx);
		} else {
			ctx.strokeStyle = this.options.strokeColor;
			ctx.lineWidth = this.options.strokeWidth;
			ctx.lineCap = this.options.lineCap;
			ctx.lineJoin = this.options.lineJoin;
			ctx.stroke();
		}

		ctx.restore();
	}
}

ShapeFactory.registerShape(Path, "Path");