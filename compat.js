// =====================================================================
//  Makes the games work on older tablets too (iPad and Android).
//
//  Newer browsers can draw boxes with rounded corners using roundRect().
//  Older ones can't, so here we teach them how. Every game loads this
//  file first. If the browser already knows roundRect, nothing changes.
// =====================================================================

(function () {
  function roundRect(x, y, w, h, radius) {
    // radius can be one number, or a list like [top-left, top-right, bottom-right, bottom-left]
    let r = Array.isArray(radius) ? radius : [radius || 0];
    if (r.length === 1) r = [r[0], r[0], r[0], r[0]];
    if (r.length === 2) r = [r[0], r[1], r[0], r[1]];
    if (r.length === 3) r = [r[0], r[1], r[2], r[1]];
    const most = Math.min(Math.abs(w), Math.abs(h)) / 2;
    const [tl, tr, br, bl] = r.map((n) => Math.min(Math.max(0, n || 0), most));
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.arcTo(x + w, y, x + w, y + tr, tr);
    this.lineTo(x + w, y + h - br);
    this.arcTo(x + w, y + h, x + w - br, y + h, br);
    this.lineTo(x + bl, y + h);
    this.arcTo(x, y + h, x, y + h - bl, bl);
    this.lineTo(x, y + tl);
    this.arcTo(x, y, x + tl, y, tl);
    this.closePath();
  }

  if (window.CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = roundRect;
  }
  if (window.Path2D && !Path2D.prototype.roundRect) {
    Path2D.prototype.roundRect = roundRect;
  }
})();
