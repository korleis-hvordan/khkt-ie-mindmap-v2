import { useEffect, useRef, useState } from 'react';

import { ActionIcon, BackgroundImage, Box } from '@mantine/core';
import { useDidUpdate, useViewportSize, useWindowScroll } from '@mantine/hooks';

import { IconX } from '@tabler/icons-react';

import { Bezier } from 'bezier-js';

import Edges from './Edges';

function drawCircle(ctx, p, r, offset) {
  offset = offset ?? { x: 0, y: 0 };
  let ox = offset.x;
  let oy = offset.y;
  ctx.beginPath();
  ctx.arc(p.x + ox, p.y + oy, r, 0, 2 * Math.PI);
  ctx.stroke();
}

function drawPoint(ctx, p, offset) {
  offset = offset ?? { x: 0, y: 0 };
  let ox = offset.x;
  let oy = offset.y;
  ctx.beginPath();
  ctx.arc(p.x + ox, p.y + oy, 5, 0, 2 * Math.PI);
  ctx.stroke();
}

function drawPoints(ctx, points, offset) {
  offset = offset ?? { x: 0, y: 0 };
  points.forEach((p) => drawCircle(ctx, p, 3, offset));
}

function drawLine(ctx, p1, p2, offset) {
  offset = offset ?? { x: 0, y: 0 };
  let ox = offset.x;
  let oy = offset.y;
  ctx.beginPath();
  ctx.moveTo(p1.x + ox, p1.y + oy);
  ctx.lineTo(p2.x + ox, p2.y + oy);
  ctx.stroke();
}

function drawSkeleton(ctx, curve, offset, nocoords) {
  offset = offset ?? { x: 0, y: 0 };
  let pts = curve.points;
  const strokeColor = ctx.strokeStyle;
  const strokeWidth = ctx.lineWidth;
  ctx.strokeStyle = "lightgrey";
  ctx.lineWidth = 2;
  drawLine(ctx, pts[0], pts[1], offset);
  if (pts.length === 3) {
    drawLine(ctx, pts[1], pts[2], offset);
  }
  else {
    drawLine(ctx, pts[2], pts[3], offset);
  }
  if (!nocoords) {
    drawPoints(ctx, pts, offset);
  }
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
}

function drawCurve(ctx, curve, offset) {
  offset = offset ?? { x: 0, y: 0 };
  let ox = offset.x;
  let oy = offset.y;
  ctx.beginPath();
  let p = curve.points;
  ctx.moveTo(p[0].x + ox, p[0].y + oy);
  if (p.length === 3) {
    ctx.quadraticCurveTo(p[1].x + ox, p[1].y + oy, p[2].x + ox, p[2].y + oy);
  }
  if (p.length === 4) {
    ctx.bezierCurveTo(
      p[1].x + ox,
      p[1].y + oy,
      p[2].x + ox,
      p[2].y + oy,
      p[3].x + ox,
      p[3].y + oy
    );
  }
  ctx.stroke();
  ctx.closePath();
}

export default function Canvas({ background, nodeList, nodeGraph, setNg, nodeRefs, currNode, disconnectMode, setDm, disconnectSource }) {
  const viewport = useViewportSize();

  const [scroll] = useWindowScroll();

  const canvasRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = "lightgray";
    ctx.lineWidth = 3;
    ctx.clearRect(0, 0, viewport.width - 250, viewport.height);

    nodeGraph.forEach((e, i) => {
      e?.forEach(ele => {
        if (ele > i) {
          return;
        }

        let source = {
          size: nodeRefs.current[i].getSize(),
          offset: nodeRefs.current[i].getOffset()
        };
        let target = {
          size: nodeRefs.current[ele].getSize(),
          offset: nodeRefs.current[ele].getOffset()
        };
        
        let source2 = structuredClone(source);
        let target2 = structuredClone(target);

        if (source.offset.x > target.offset.x) {
          [source, target] = [target, source];
        }

        if (source2.offset.y > target2.offset.y) {
          [source2, target2] = [target2, source2];
        }

        const distX = target.offset.x - source.offset.x - source.size.width;
        const distY = target2.offset.y - source2.offset.y - source2.size.height;

        let curve;

        if (distX > 0 && distX > distY) {
          curve = new Bezier(
            source.offset.x + source.size.width, source.offset.y + source.size.height / 2,
            source.offset.x + source.size.width + distX / 4, source.offset.y + source.size.height / 2,
            target.offset.x - distX / 4, target.offset.y + target.size.height / 2,
            target.offset.x, target.offset.y + target.size.height / 2
          );
        }
        else if (distY > 0) {
          curve = new Bezier(
            source2.offset.x + source2.size.width / 2, source2.offset.y + source2.size.height,
            source2.offset.x + source2.size.width / 2, source2.offset.y + source2.size.height + distY / 4,
            target2.offset.x + target2.size.width / 2, target2.offset.y - distY / 4,
            target2.offset.x + target2.size.width / 2, target2.offset.y
          );
        }

        if (curve) {
          drawCurve(ctx, curve, { x: -scrollX, y: -scrollY });
        }
      });
    });
  }, [nodeGraph, viewport, scroll, currNode]);

  const disconnectRef = useRef(null);

  const [disconnectGraph, setDg] = useState([]);

  useDidUpdate(() => {
    const graph = [];
    if (nodeGraph[disconnectSource]) {
      graph[disconnectSource] = [...nodeGraph[disconnectSource]];
    }
    setDg(graph);
  }, [disconnectSource, nodeGraph]);

  const [bg, setBg] = useState(null);

  useEffect(() => {
    setBg(background ? URL.createObjectURL(background) : '');
  }, [background]);

  return (
    <Box pos="relative">
      <BackgroundImage h="100%" pos="fixed" src={bg} />
      <canvas width={viewport.width - 250} height={viewport.height} ref={canvasRef}
        style={{ position: 'fixed' }}
      />
      {nodeList}
      {disconnectMode && <Edges ref={disconnectRef}
        graph={disconnectGraph} nodeRefs={nodeRefs} currNode={currNode}
        EdgeComponent={({ ...props }) =>
          <ActionIcon size="2rem" variant="filled" radius="xl" color="orange" pos="absolute"
            {...props}
            onClick={() => {
              setNg(curr => {
                const { node1, node2 } = disconnectRef.current.getCurr();
    
                const copy = curr.slice();
                copy[node1].delete(node2);
                copy[node2].delete(node1);
                return copy;
              });
              setDm(false);
            }}
          >
            <IconX />
          </ActionIcon>
        }
      />}
    </Box>
  );
}