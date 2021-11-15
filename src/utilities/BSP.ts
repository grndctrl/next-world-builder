class Area {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

class BSP {
  area: Area;
  a: Area;
  b: Area;

  constructor(area: Area) {
    this.area = area;

    const areas = this.split(true, 0.5);
    this.a = areas[0];
    this.b = areas[1];
  }

  split(horizontal: boolean, splitPercentage: number): Area[] {
    const area = this.area;

    const a = new Area(
      area.x,
      area.y,
      horizontal ? area.width * splitPercentage : area.width,
      horizontal ? area.height : area.height * splitPercentage
    );

    const b = new Area(
      horizontal ? area.x + area.width * splitPercentage : area.x,
      horizontal ? area.y : area.y + area.height * splitPercentage,
      horizontal ? area.width * (1 - splitPercentage) : area.width,
      horizontal ? area.height : area.height * (1 - splitPercentage)
    );

    this.a = a;
    this.b = b;

    return [a, b];
  }
}

function contour(areas: Area[]): Area {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  areas.forEach((area) => {
    if (area.x < minX) {
      minX = area.x;
    }
    if (area.y < minY) {
      minY = area.y;
    }
    if (area.x + area.width > maxX) {
      maxX = area.x + area.width;
    }
    if (area.y + area.height > maxY) {
      maxY = area.y + area.height;
    }
  });

  return new Area(minX, minY, maxX - minX, maxY - minY);
}

export { Area, BSP, contour };
