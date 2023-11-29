import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { ActionIcon, Button, Center, CloseButton, ColorPicker, FileButton, Group, Image, Modal, Popover, ScrollArea, Select, TextInput, Textarea, ThemeIcon } from '@mantine/core';
import { useDidUpdate } from '@mantine/hooks';

import { IconColorFilter, IconFileImport, IconTrash, IconX } from '@tabler/icons-react';

const dataToBlob = async (imageData) => {
  if (imageData === null) {
    return null;
  }
  return await (await fetch(imageData)).blob();
};

const Editor = forwardRef(({ iColor, iSubject, iBody, iFile, colors, setColors, customColor, setCc, useCustom, setUc, opened, openHandler, action, actionOnClick }, ref) => {
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

  const select = useRef(null);

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
    getFile() {
      return file;
    },
    setSubject(subject) {
      setSubject(subject)
    },
    setBody(body) {
      setBody(body)
    },
    setFile(file) {
      setFile(file);
    }
  }), [color, subject, body, file]);

  const [doAction, setDa] = useState(false);

  useDidUpdate(() => {
    if (opened) {
      setDa(false);
    }
  }, [opened]);

  useDidUpdate(() => {
    if (doAction) {
      actionOnClick();
    }
  }, [doAction]);

  return (
    <Modal opened={opened} centered radius="lg"
      withCloseButton={false} padding="md" shadow="xl" lockScroll={false}
      onClose={() => { if (useCustom) { setUc(false); } openHandler.close(); }}
      styles={{
        body: {
          padding: 0
        }
      }}
    >
      <Group position="apart" p="md">
        <ActionIcon radius="xl" size="lg"
          onClick={() => { if (useCustom) { setUc(false); } openHandler.close(); }}
        >
          <IconX size="1.5rem" />
        </ActionIcon>
        <Button radius="xl" size="lg" compact color="pink.6"
          disabled={!subject.trim().length && !body.trim().length && !file}
          onClick={() => {
            if (useCustom) {
              setUc(false);
              setColor(customColor);
              setColors(curr => [...curr, customColor]);
            }
            setDa(true);
          }}
        >{action}</Button>
      </Group>
      <ScrollArea px="md" h="30rem">
        <TextInput size="2em" variant="unstyled" placeholder="Nội dung"
          value={subject}
          onChange={e => setSubject(e.currentTarget.value)}
        />
        {!file && <Center h="6rem">
          <FileButton size="2.5rem" radius="lg" variant="filled" color="orange"
            accept="image/*"
            onChange={setFile}
          >
            {props =>
              <ActionIcon {...props}>
                <IconFileImport />
              </ActionIcon>
            }
          </FileButton>
        </Center>}
        {file && <Image my="md" radius="md" src={fille} />}
        <Textarea size="lg" variant="unstyled" minRows={8}
          placeholder="Hãy viết gì đó..."
          value={body}
          onChange={e => setBody(e.currentTarget.value)}
        />
      </ScrollArea>
      <Group p="md">
        <Select w="38%" radius="xl" ref={select}
          {...(useCustom && { searchable: true, creatable: true })}
          itemComponent={forwardRef(({ value, ...others }, ref) => (
            <Group ref={ref} {...others} spacing="xs">
              <ThemeIcon size="xs" color={value.toLowerCase()} radius="xl" />
              {value}
            </Group>
          ))}
          data={colors}
          onChange={setColor}
          value={color}
          {...(useCustom && { searchValue: customColor })}
          icon={
            <ThemeIcon size="xs" radius="xl"
              color={useCustom ? customColor : color.toLowerCase()}
            />
          }
          {...(useCustom && !colors.includes(customColor) && { rightSection:
            <CloseButton radius="xl"
              onClick={() => setUc(false)}
            />
          })}
          getCreateLabel={q => 
            <Group spacing="xs">
              + Add
              <ThemeIcon color={q} radius="xl" size="xs" />
            </Group>
          }
          onCreate={q => {
            setColors(curr => [...curr, q]);
            setUc(false);
            setColor(q);
          }}
          transitionProps={{ transition: 'pop-bottom-left', duration: 80, timingFunction: 'ease' }}
          styles={theme => ({
            dropdown: {
              borderRadius: theme.radius.lg,
            },
            item: {
              fontSize: theme.fontSizes.lg,
              '&[data-selected]': {
                '&, &:hover': {
                  color: 'black',
                  backgroundColor: theme.colors.teal[2]
                }
              }
            },
            input: {
              fontSize: theme.fontSizes.lg
            }
          })}
        />
        <Popover withArrow shadow="xl"
          onOpen={() => setUc(true)}
          onClose={() => {
            if (!colors.includes(customColor)) {
              select.current.focus();
            }
            else {
              setUc(false);
            }
          }}
        >
          <Popover.Target>
            <ActionIcon radius="xl" variant="filled"
              sx={{
                backgroundImage: `conic-gradient(
                  from 90deg,
                  violet,
                  indigo,
                  blue,
                  green,
                  yellow,
                  orange,
                  red,
                  violet
                )`,
                border: 0
              }}
            >
              <IconColorFilter size="1.2rem" />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown>
            <ColorPicker value={customColor} onChange={setCc} />
          </Popover.Dropdown>
        </Popover>
        {file &&
          <ActionIcon variant="filled" radius="xl"
            onClick={() => setFile(null)}
          >
            <IconTrash size="1.3rem" />
          </ActionIcon>
        }
      </Group>
    </Modal>
  );
});

export default Editor;