export class Point2d {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

export class Line {
  constructor(point1, point2) {
    this.point1 = point1;
    this.point2 = point2;
  }
}

export const orthoLineLineRelationshipType = {
  nothing: 0,
  intersect: 1,
  overlap: 2
}

export const rectRectRelationshipType = {
  disjoint: 0,
  match: 1,
  intersect: 2,
  AInsideB: 3,
  BInsideA: 4,
  tangent: 5
}

export class OrthoLineLineRelationship {
  constructor(orthoLineLineRelationshipType, intersection = undefined, overlap = undefined) { // (orthoLineLineRelationshipType, {intersection=undefined, overlap=undefined} = {})
    this.type = orthoLineLineRelationshipType;
    this.intersection = intersection;
    this.overlap = overlap;
  }
}

export class Rectangle {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

export class GeometryCalc {

  static ptsDistance(pt1, pt2) {
    return Math.sqrt(Math.pow((pt2.x - pt1.x), 2) + (Math.pow((pt2.y - pt1.y), 2)));
  }

  static lineMiddlePt(line) {
    return { x: (line[0].x + line[1].x) / 2, y: (line[0].y + line[1].y) / 2 };
  }

  static areLinesEqual(line1, line2) {
    return (this.arePointsEqual(line1[0], line2[0]) && this.arePointsEqual(line1[1], line2[1])) || (this.arePointsEqual(line1[0], line2[1]) && this.arePointsEqual(line1[1], line2[0]));
  }

  static arePointsEqual(point1, point2) {
    return point1.x === point2.x && point1.y === point2.y;
  }

}
