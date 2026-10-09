import { select } from "d3-selection";
import { zoom, zoomIdentity, zoomTransform, type D3ZoomEvent, type ZoomTransform } from "d3-zoom";
import { useCallback, useEffect, useRef, useState } from "react";

// How far the map goes in: 8x puts DKI Jakarta, the smallest province, at about the width of Jawa
// Timur unzoomed. A button step of 1.6 reaches that in four presses.
const maxScale = 8;

const buttonStep = 1.6;

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

type AttachedZoom = {
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
  readonly reset: () => void;
  readonly detach: () => void;
};

// The d3 half, kept out of the hook because it is plain DOM wiring: it binds the gestures to
// `viewport` and reports every resulting transform.
function attachZoom(
  viewport: HTMLDivElement,
  onTransform: (transform: ZoomTransform) => void,
): AttachedZoom {
  const behavior = zoom<HTMLDivElement, unknown>()
    .scaleExtent([1, maxScale])
    // Keep the map covering the frame. d3's own constraint works off a translate extent fixed at
    // setup; `extent` is measured from the live element, so this one survives a resize.
    .constrain((transform, extent) => {
      const width = extent[1][0] - extent[0][0];
      const height = extent[1][1] - extent[0][1];

      return zoomIdentity
        .translate(
          clamp(transform.x, (1 - transform.k) * width, 0),
          clamp(transform.y, (1 - transform.k) * height, 0),
        )
        .scale(transform.k);
    })
    // d3-zoom offers wheel, dblclick, mousedown and touchstart here. WheelEvent extends MouseEvent,
    // so it has to be asked about first.
    .filter((event: WheelEvent | MouseEvent | TouchEvent) => {
      // A plain wheel scrolls the page. Ctrl or Cmd held zooms, which is also what a trackpad pinch
      // sends.
      if (event instanceof WheelEvent) {
        return event.ctrlKey || event.metaKey;
      }

      // Two fingers always belong to the map. One belongs to the page while the map is at its
      // fitted view and to the map once it is zoomed in, which is the same split the viewport's
      // touch-action makes.
      if ("touches" in event) {
        return event.touches.length > 1 || zoomTransform(viewport).k > 1;
      }

      // A click picks a province, so a double click must not also zoom.
      return event.type !== "dblclick" && event.button === 0;
    })
    .on("zoom", (event: D3ZoomEvent<HTMLDivElement, unknown>) => onTransform(event.transform));

  const selection = select(viewport);

  selection.call(behavior);

  return {
    zoomIn: () => behavior.scaleBy(selection, buttonStep),
    zoomOut: () => behavior.scaleBy(selection, 1 / buttonStep),
    reset: () => behavior.transform(selection, zoomIdentity),
    detach: () => selection.on(".zoom", null),
  };
}

// Zoom and pan for the province map. The transform is a CSS transform on a wrapper, never a new
// projection: refitting the 34 features costs about 13 ms a frame on a desktop, which no gesture can
// carry. The chart resolves the pointer through the SVG's getScreenCTM, which already carries an
// ancestor's CSS transform, so hover, selection and the tooltip keep hitting the right province.
//
// Hook up `viewportRef` on a clipping box and `contentRef` on the box that holds the chart. The
// transform goes straight onto the content element rather than through state, so a gesture costs no
// render; only crossing in or out of 1x does, to light the buttons up.
export function useMapZoom() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const attached = useRef<AttachedZoom | null>(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (viewport === null) {
      return;
    }

    const next = attachZoom(viewport, (transform) => {
      const { k, x, y } = transform;
      const content = contentRef.current;

      if (content !== null) {
        content.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
        content.style.setProperty("--map-k", String(k));
      }

      setZoomed(k > 1);
    });

    attached.current = next;

    return () => {
      next.detach();
      attached.current = null;
    };
  }, []);

  const zoomIn = useCallback(() => attached.current?.zoomIn(), []);
  const zoomOut = useCallback(() => attached.current?.zoomOut(), []);
  const reset = useCallback(() => attached.current?.reset(), []);

  return { viewportRef, contentRef, zoomed, zoomIn, zoomOut, reset };
}
