import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { Text, Paper, Title, Menu, ActionIcon, Group, ThemeIcon, Button, px, useMantineTheme, Image, Stack, Box } from '@mantine/core';
import { useDidUpdate, useElementSize, useForceUpdate, useInterval, useMergedRef, useMouse, useViewportSize, useWindowScroll } from '@mantine/hooks';

import { IconDotsVertical, IconEdit, IconLink, IconLinkOff, IconTrash } from '@tabler/icons-react';

function getRGB(c) {
  return parseInt(c, 16) || c;
}

function getsRGB(c) {
  return getRGB(c) / 255 <= 0.03928
    ? getRGB(c) / 255 / 12.92
    : Math.pow((getRGB(c) / 255 + 0.055) / 1.055, 2.4);
}

function getLuminance(hexColor) {
  return (
    0.2126 * getsRGB(hexColor.substr(1, 2)) +
    0.7152 * getsRGB(hexColor.substr(3, 2)) +
    0.0722 * getsRGB(hexColor.substr(-2))
  );
}

function getContrast(f, b) {
  const L1 = getLuminance(f);
  const L2 = getLuminance(b);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

function getTextColor(bgColor, light, dark) {
  const whiteContrast = getContrast(bgColor, light);
  const blackContrast = getContrast(bgColor, dark);

  return whiteContrast > blackContrast ? light : dark;
}

const dataToBlob = async (imageData) => {
  if (imageData === null) {
    return null;
  }
  return await (await fetch(imageData)).blob();
};

const Node = forwardRef(({ index, pos, iColor, iSubject, iBody, iFile, iWidth, setCn, setNl, setNg, connectMode, setCm, setCs, setCt, disconnectMode, setDm, setDs, editHandler }, ref) => {
  const [color, setColor] = useState(iColor);
  const [subject, setSubject] = useState(iSubject);
  const [body, setBody] = useState(iBody);
  const [file, setFile] = useState(iFile);

  const [fille, setFille] = useState(null);

  useEffect(() => {(async () => {
    let f;
    if (typeof file == 'string') {
      f = await dataToBlob(file);
    }
    else {
      f = file;
    }
    setFille(f ? URL.createObjectURL(f) : '');
  })()}, [file]);

  const lColor = color.toLowerCase();

  const [connect, setConnect] = useState(connectMode);
  const [self, setSelf] = useState(true);

  useDidUpdate(() => {
    if (!connect) {
      setSelf(true);
    }
  }, [connect]);

  const [disconnect, setDisconnect] = useState(disconnectMode);

  const mouse = useMouse();
  const iMouse = useMouse();

  const size = useElementSize();

  const mergedRef = useMergedRef(iMouse.ref, size.ref);
  
  const viewport = useViewportSize();

  const [scroll] = useWindowScroll();
  
  const forceUpdate = useForceUpdate();
  
  const [move, setMove] = useState(false);
  const [initialImp, setIimp] = useState();
  const [offset, setOffset] = useState(pos);

  const [width, setWidth] = useState(iWidth);
  const [initialWidth, setIw] = useState(null);

  const theme = useMantineTheme();

  function getSize() {
    return {
      width: width,
      height: size.height + 2 * px(theme.spacing.xs) // stupid shit
    };
  }

  useEffect(() => {
    setCn({ index: index, offset: offset });
  }, []);

  useDidUpdate(() => {
    setCn(curr => ({ ...curr, size: getSize() }));
  }, [size.width, size.height]);

  useDidUpdate(() => {
    setCn(curr => ({ ...curr, offset: offset }));
  }, [offset]);

  useDidUpdate(() => {
    if (!move) {
      return;
    }

    setOffset({
      x: Math.max(mouse.x - 250 - initialImp.x + scrollX, 0),
      y: Math.max(mouse.y - initialImp.y + scrollY, 0)
    });
  }, [mouse.x, mouse.y, scroll]);

  const [autoMoveX, setAmX] = useState(false);
  const [autoMoveY, setAmY] = useState(false);

  useDidUpdate(() => {
    if (!move) {
      return;
    }
        
    if (mouse.x > viewport.width - 100 - 250) {
      if (!autoMoveX) {
        setAmX(true);
      }
    }
    else if (autoMoveX) {
      setAmX(false);
    }
    
    if (mouse.y > viewport.height - 100) {
      if (!autoMoveY) {
        setAmY(true);
      }
    }
    else if (autoMoveY) {
      setAmY(false);
    }
  }, [mouse.x, mouse.y]);
    
  const amIntervalX = useInterval(() => {
    forceUpdate();
    scrollTo(document.body.scrollWidth, scrollY);
  }, 1);
  const amIntervalY = useInterval(() => {
    forceUpdate();
    scrollTo(scrollX, document.body.scrollHeight);
  }, 1);

  useDidUpdate(() => {
    amIntervalX.toggle();
  }, [autoMoveX]);

  useDidUpdate(() => {
    amIntervalY.toggle();
  }, [autoMoveY]);
  
  useImperativeHandle(ref, () => ({
    getColor() {
      return color;
    },
    getSubject() {
      return subject;
    },
    getBody() {
      return body;
    },
    getOffset() {
      return offset;
    },
    getSize() {
      return getSize();
    },
    getFile() {
      return file;
    },
    setColor(color) {
      setColor(color);
    },
    setSubject(subject) {
      setSubject(subject);
    },
    setBody(body) {
      setBody(body);
    },
    setFile(file) {
      setFile(file);
    },
    setConnect(val) {
      setConnect(val);
    },
    setDisconnect(val) {
      setDisconnect(val);
    }
  }), [color, subject, body, offset, size.width, size.height]);

  return (
    <Paper radius="lg" shadow="xl" bg={lColor} pos="absolute" miw={100} w={width}
      py="xs" px="md"
      ref={mergedRef}
      left={Math.max(move ? mouse.x - 250 - initialImp.x + scrollX : offset.x, 0)}
      top={Math.max(move ? mouse.y - initialImp.y + scrollY : offset.y, 0)}
      sx={theme => ({
        ...(move && { zIndex: 1 }),
        userSelect: 'none',
        '&:hover': {
          outline: move ? '8px ridge rgba(51, 204, 51, .6)' : '8px ridge rgba(170, 50, 220, .6)'
        },
        overflowWrap: 'break-word',
        color: getTextColor(
          theme.colors[lColor]?.[theme.primaryShade[theme.colorScheme]] ?? color,
          '#ffffff', '#000000'
        ) 
      })}
      onMouseDown={() => {        
        setMove(true);
        setIimp({ x: iMouse.x, y: iMouse.y });
      }}
      onMouseUp={() => {
        setAmX(false);
        setAmY(false);
        setMove(false);
        setOffset({
          x: Math.max(mouse.x - 250 - initialImp.x + scrollX, 0),
          y: Math.max(mouse.y - initialImp.y + scrollY, 0)
        });
      }}
    >
      {!connect && !disconnect && <Menu radius="lg">
        <Menu.Target>
          <ActionIcon size="sm" radius="xl"
            sx={theme => ({
              float: 'right',
              color: getTextColor(
                theme.colors[lColor]?.[theme.primaryShade[theme.colorScheme]] ?? color,
                theme.colors.gray[3], theme.colors.gray[7]
              )
            })}
            onMouseDown={e => e.stopPropagation()}
            onMouseUp={e => e.stopPropagation()}
            onClick={() => setCn({ index: index, offset: offset, size: getSize() })}
          >
            <IconDotsVertical />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item fz="lg"
            onMouseDown={e => e.stopPropagation()}
            onMouseUp={e => e.stopPropagation()}
            onClick={() => editHandler.open()}
          >
            <Group spacing="xs">
              <ThemeIcon radius="xl" variant="default"
                sx={{ border: 0, backgroundColor: 'transparent' }}
              >
                <IconEdit />
              </ThemeIcon>
              Edit post
            </Group>
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item fz="lg"
            onMouseDown={e => e.stopPropagation()}
            onMouseUp={e => e.stopPropagation()}
            onClick={() => { setCm(true); setCs(index); setSelf(false); } }
          >
            <Group spacing="xs">
              <ThemeIcon radius="xl" variant="default"
                sx={{ border: 0, backgroundColor: 'transparent' }}
              >
                <IconLink />
              </ThemeIcon>
              Connect to a post
            </Group>
          </Menu.Item>
          <Menu.Item fz="lg"
            onMouseDown={e => e.stopPropagation()}
            onMouseUp={e => e.stopPropagation()}
            onClick={() => { setDm(true); setDs(index); }}
          >
            <Group spacing="xs">
              <ThemeIcon radius="xl" variant="default"
                sx={{ border: 0, backgroundColor: 'transparent' }}
              >
                <IconLinkOff />
              </ThemeIcon>
              Disconnect from a post
            </Group>
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item fz="lg"
            disabled={index === 0}
            color="red"
            onMouseDown={e => e.stopPropagation()}
            onMouseUp={e => e.stopPropagation()}
            onClick={() => {
              setNl(curr => {
                const copy = curr.slice();
                copy[index] = null;
                return copy;
              });
              setNg(curr => {
                const copy = curr.slice();
                if (copy[index]) {
                  copy[index] = null;
                }
                copy.forEach(e => e?.delete(index));
                return copy;
              });
            }}
          >
            <Group spacing="xs">
              <ThemeIcon radius="xl" variant="default"
                sx={theme => ({
                  border: 0,
                  backgroundColor: 'transparent',
                  color: theme.colors.red[theme.primaryShade[theme.colorScheme]]
                })}
              >
                <IconTrash />
              </ThemeIcon>
              Delete post
            </Group>
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>}
      <Title order={3}>{subject}</Title>
      {file &&
        <Image radius="md" src={fille}
          mt={5}
          {...(body.trim().length && { mb: 5 })}
          styles={{
            image: {
              pointerEvents: 'none'
            },
            root: {
              display: 'inline-block',
            }
          }}
        />
      }
      <Box pos="absolute" bottom={0} right={0} bg="black" h={10} w={10} draggable={true}
        sx={{
          borderTopLeftRadius: '100%',
          borderBottomRightRadius: '100%',
          '&:hover': {
            cursor: 'nwse-resize'
          }
        }}
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
        onDragStart={e => {
          setIimp({ x: e.clientX, y: e.clientY });
          setIw(width);
        }}
        onDrag={e => setWidth(initialWidth + e.clientX - initialImp.x)}
        onDragEnd={e => setWidth(initialWidth + e.clientX - initialImp.x)} // tao deo hieu sao
      />
      <Text fz="lg">{body}</Text>
      {connect && self && <Button
        color="yellow.4" fz="xl"
        sx={{
          position: 'absolute',
          inset: 0,
          margin: 'auto',
          width: 'fit-content'
        }}
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
        onClick={() => { setCm(false); setCt(index); }}
      >
        CONNECT
      </Button>}
    </Paper>
  );
});

export default Node;