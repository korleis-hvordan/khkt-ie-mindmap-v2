import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { px } from '@mantine/core';
import { useWindowScroll } from '@mantine/hooks';

const Edges = forwardRef(({ graph, nodeRefs, currNode, EdgeComponent }, ref) => {
  const [scroll] = useWindowScroll();

  const [edges, setEdges] = useState([]);

  const [curr, setCurr] = useState(null);

  useImperativeHandle(ref, () => {
    return {
      getCurr() {
        return curr;
      }
    };
  }, [curr]);

  useEffect(() => {
    setEdges(() => {
      const copy = [];
      graph.forEach((e, i) => {
        e?.forEach(ele => {
          setCurr({ node1: i, node2: ele });

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
    
          let top, left;

          const btnSize = px('2rem');

          if (distX > distY) {
            left = source.offset.x + source.size.width + distX / 2 - btnSize / 2;

            if (source.offset.y > target.offset.y) {
              [source, target] = [target, source];
            }

            top = source.offset.y / 2 + source.size.height / 4 + target.offset.y / 2 +
              target.size.height / 4 - btnSize / 2;
          }
          else {
            top = source2.offset.y + source2.size.height + distY / 2 - btnSize / 2;

            if (source2.offset.x > target2.offset.x) {
              [source2, target2] = [target2, source2];
            }

            left = source2.offset.x / 2 + source2.size.width / 4 + target2.offset.x / 2 +
              target2.size.width / 4 - btnSize / 2;
          }

          copy.push(
            <EdgeComponent position="absolute" top={top} left={left} />
          );
        });
      });
      return copy;
    });
  }, [graph, scroll, currNode]);

  return (
    <>{edges}</>
  );
});

export default Edges;