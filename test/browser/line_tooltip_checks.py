"""Independent visual-geometry checks for both fit diagrams. No screenshots."""
def assert_tooltip_clearance(tooltip, width, context):
    placement = tooltip.get_attribute('data-placement')
    box = tooltip.bounding_box()
    assert box['x'] >= 0 and box['x'] + box['width'] <= width + 1, (context, box)
    if placement == 'floating':
        assert box['y'] >= 0 and box['y'] + box['height'] <= 1001, (context, box)
    else:
        assert placement == 'dock', (context, placement)
    assert tooltip.evaluate("""tip => {
        const root = tip.closest('.line-monitor');
        const t = tip.getBoundingClientRect();
        const overlaps = b => t.left < b.right && t.right > b.left && t.top < b.bottom && t.bottom > b.top;
        const drawing = root.querySelector('[data-diagram-viewport]');
        if (tip.dataset.placement === 'dock') {const panel=root.querySelector('.diagram-details').getBoundingClientRect();return !overlaps(drawing.getBoundingClientRect())&&t.left>=panel.left&&t.right<=panel.right&&t.top>=panel.top&&t.bottom<=panel.bottom;}

        const image = drawing.querySelector('svg image').getBoundingClientRect();
        const [cw,ch,encoded] = root.dataset.calloutMask.split(',');
        const columns = Number(cw), rows = Number(ch), bits = atob(encoded);
        const x0 = Math.max(0, Math.floor((t.left-image.left)/image.width*columns));
        const x1 = Math.min(columns, Math.ceil((t.right-image.left)/image.width*columns));
        const y0 = Math.max(0, Math.floor((t.top-image.top)/image.height*rows));
        const y1 = Math.min(rows, Math.ceil((t.bottom-image.top)/image.height*rows));
        for (let y=y0; y<y1; y++) {
            for (let x=x0; x<x1; x++) {
                const i = y*columns+x;
                if ((bits.charCodeAt(i >> 3) >> (i & 7)) & 1) return false;
            }
        }
        for (const pin of drawing.querySelectorAll('button[data-callout]')) {
            if (overlaps(pin.getBoundingClientRect())) return false;
        }
        for (const guide of drawing.querySelectorAll('[data-active="true"] [data-line-leader]')) {
            const length = guide.getTotalLength(), matrix = guide.getScreenCTM();
            for (let i=0; i<=100; i++) {
                const q = guide.getPointAtLength(length*i/100);
                const p = new DOMPoint(q.x,q.y).matrixTransform(matrix);
                if (p.x >= t.left && p.x <= t.right && p.y >= t.top && p.y <= t.bottom) return false;
            }
        }
        return true;
    }"""), (context, placement)
