import './App.css';

import { forwardRef, useEffect, useRef, useState } from 'react';

import { ActionIcon, Button, Dialog, Divider, Drawer, FileButton, Group, Image, MantineProvider, Paper, Select, Text, Title } from '@mantine/core';
import { useDidUpdate, useDisclosure, useViewportSize } from '@mantine/hooks';

import { IconPlus } from '@tabler/icons-react';

import Canvas from './components/Canvas';
import Node from './components/Node';
import NodeM from './components/NodeM'
import Editor from './components/Editor';
import { IconSettings } from '@tabler/icons-react';

function App() {
  const nodeRefs = useRef([]);
  const [nodeList, setNl] = useState([]);
  const [nodeGraph, setNg] = useState([]);
  const [currNode, setCn] = useState(null);

  const newRef = useRef(null);
  const [newOpened, newHandler] = useDisclosure(false);

  const editRef = useRef(null);
  const [editOpened, editHandler] = useDisclosure(false);

  const [connectMode, setCm] = useState(false);
  const [connectSource, setCs] = useState(null);
  const [connectTarget, setCt] = useState(null);

  const [settingsOpened, { close, open }] = useDisclosure(false);
  const [currFont, setCf] = useState('Montserrat');

  const viewport = useViewportSize();

  const [background, setBg] = useState(null);

  useEffect(() => {
    fetch(`/src/assets/${Math.floor(Math.random() * 3) + 1}.jpg`)
    .then(res => res.blob()).then(bg => setBg(bg));
  }, []);

  useDidUpdate(() => {
    nodeRefs.current.forEach(e => e?.setConnect(connectMode));

    if (connectMode) {
      setCt(null);
    }
    else {
      if (connectTarget !== null && !(nodeGraph[connectSource]?.has(connectTarget) ||
          nodeGraph[connectTarget]?.has(connectSource))) {
        setNg(curr => {
          const copy = curr.slice();
          if (typeof(copy[connectSource]) === 'object') {
            copy[connectSource].add(connectTarget);
          }
          else {
            copy[connectSource] = new Set([connectTarget]);
          }

          if (typeof(copy[connectTarget]) === 'object') {
            copy[connectTarget].add(connectSource);
          }
          else {
            copy[connectTarget] = new Set([connectSource]);
          }

          return copy;
        });
      }

      setCs(null);
      setCt(null);
    }
  }, [connectMode]);

  const [disconnectMode, setDm] = useState(false);
  const [disconnectSource, setDs] = useState(null);

  useDidUpdate(() => {
    nodeRefs.current.forEach(e => e?.setDisconnect(disconnectMode));

    if (!disconnectMode) {
      setDs(null);
    }
  }, [disconnectMode]);

  const [colors, setColors] = useState([
    "Dark", "Gray", "Red", "Pink", "Grape", "Violet", "Indigo", "Blue",
    "Cyan", "Teal", "Green", "Lime", "Yellow", "Orange"
  ]);
  const [customColor, setCc] = useState('#ffffff');
  const [useCustom, setUc] = useState(false);

  useEffect(() => {
    document.addEventListener("dragover", (event) => {
      event.preventDefault();
  });
  }, []);

  return (
    <MantineProvider
      theme={{
        fontFamily: currFont
      }}
    >
      <Canvas background={background} nodeList={nodeList} nodeGraph={nodeGraph} setNg={setNg}
        nodeRefs={nodeRefs} currNode={currNode}
        disconnectMode={disconnectMode} setDm={setDm}
        disconnectSource={disconnectSource}
      />
      <Drawer.Root opened={settingsOpened} onClose={close} title="Settings">
        <Drawer.Overlay />
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title><Text fz="xl">Settings</Text></Drawer.Title>
            <Drawer.CloseButton />
          </Drawer.Header>
          <Drawer.Body>
            <Title order={4}>Appearance</Title>
            <Paper radius="lg" bg="gainsboro" my="md" p="md">
              <Group position="apart">
                <Text>Font</Text>
                <Select w="50%" radius="xl"
                  itemComponent={forwardRef(({ value, ...others }, ref) => (
                    <Text ref={ref} {...others} ff={value}>
                      {value}
                    </Text>
                  ))}
                  data={['Montserrat', 'Roboto', 'Indie Flower']}
                  onChange={setCf}
                  value={currFont}
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
              </Group>
              <Divider size="md" my="sm" />
              <Group position="apart" pos="relative">
                <Text>Background</Text>
                <Image maw={250} src={background ? URL.createObjectURL(background) : ''} />
                <FileButton pos="absolute" w="100%" h="100%" variant="outline"
                  styles={{
                    root: {
                      border: 'none'
                    }
                  }}
                  onChange={setBg}
                >
                  {props => <Button {...props} />}
                </FileButton>
              </Group>
            </Paper>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>
      <ActionIcon size={50} variant="filled"
        pos="fixed" top={15} left={15}
        onClick={open}
      >
        <IconSettings size={40} />
      </ActionIcon>
      <ActionIcon variant="filled" radius="xl" size={60} color="red.7"
        pos="fixed" bottom={40} right={60}
        onClick={newHandler.open}
        sx={{
          zIndex: 1,
          transition: '250ms ease',
          '&:hover': {
            rotate: '45deg',
            transition: '250ms ease'
          }
        }}
      >
        <IconPlus size={32} />
      </ActionIcon>
      <Editor
        ref={newRef} opened={newOpened} openHandler={newHandler}
        iColor="Red" iSubject="" iBody="" iFile={null}
        colors={colors} setColors={setColors}
        customColor={customColor} setCc={setCc}
        useCustom={useCustom} setUc={setUc}
        action="Publish"
        actionOnClick={() => {
          const index = nodeList.length;
          setNl(curr =>
            [...curr,
              window.ontouchstart !== undefined ?
              <NodeM index={index} pos={{ x: viewport.width / 2, y: viewport.height / 2 }}
                iColor={newRef.current.getColor()}
                iSubject={newRef.current.getSubject()}
                iBody={newRef.current.getBody()}
                iFile={newRef.current.getFile()}
                setCn={setCn} setNl={setNl}
                nodeGraph={nodeGraph} setNg={setNg}
                connectMode={connectMode} setCm={setCm}
                setCs={setCs} setCt={setCt}
                disconnectMode={disconnectMode} setDm={setDm} setDs={setDs}
                editHandler={editHandler}
                ref={e => nodeRefs.current[index] = e}
                key={index}
              /> :
              <Node index={index}
                pos={{ x: viewport.width / 2 + scrollX, y: viewport.height / 2 + scrollY}}
                iColor={newRef.current.getColor()}
                iSubject={newRef.current.getSubject()}
                iBody={newRef.current.getBody()}
                iFile={newRef.current.getFile()}
                setCn={setCn} setNl={setNl}
                nodeGraph={nodeGraph} setNg={setNg}
                connectMode={connectMode} setCm={setCm}
                setCs={setCs} setCt={setCt}
                disconnectMode={disconnectMode} setDm={setDm} setDs={setDs}
                editHandler={editHandler}
                ref={e => nodeRefs.current[index] = e}
                key={index}
              />
            ]
          );

          newRef.current.setSubject('');
          newRef.current.setBody('');
          newRef.current.setFile(null);
          newHandler.close();
        }}
      />
      <Editor ref={editRef}
        iColor={nodeRefs.current[currNode?.index]?.getColor() ?? "Red"}
        iSubject={nodeRefs.current[currNode?.index]?.getSubject() ?? ""}
        iBody={nodeRefs.current[currNode?.index]?.getBody() ?? ""}
        iFile={nodeRefs.current[currNode?.index]?.getFile() ?? null}
        key={currNode?.index} // ao ma vcl
        colors={colors} setColors={setColors}
        customColor={customColor} setCc={setCc}
        useCustom={useCustom} setUc={setUc}
        opened={editOpened} openHandler={editHandler}
        action="Update"
        actionOnClick={() => {
          const currRef = nodeRefs.current[currNode?.index];
          currRef.setColor(editRef.current.getColor());
          currRef.setSubject(editRef.current.getSubject());
          currRef.setBody(editRef.current.getBody());
          currRef.setFile(editRef.current.getFile());

          editHandler.close();
        }}
      />
      <Dialog opened={connectMode} radius="lg" py="xs" fz="xl" w="fit-content"
        position={{ bottom: 20, left: 20 }}
      >
        <Group>
          Pick a post to connect to
          <Button fz="xl" onClick={() => setCm(false)}>Cancel</Button>
        </Group>
      </Dialog>
      <Dialog opened={disconnectMode} radius="lg" py="xs" fz="xl" w="fit-content"
        position={{ bottom: 20, left: 20 }}
      >
        <Group>
          Pick a post to disconnect from
          <Button fz="xl" onClick={() => setDm(false)}>Cancel</Button>
        </Group>
      </Dialog>
    </MantineProvider>
  );
}

export default App;

// h₂ólyoes ĝʰmónes h₁léwdʰeroes somHóeskʷe gʷr̥Htóteh₂ti h₃r̥ĝtúsukʷe ĝn̥h₁yóntor. éybʰos dh₃tóy
// ménos k̂ḗrkʷe h₁stés h₂énteroeykʷe sm̥h₂éleyes bʰréh₂tr̥bʰos swé h₂éĝoyh₁n̥t.

// [i] mis
// [iː] mile
// [e̝] list
// [ɛ̝] brist
// [e̝ː] mele
// [ɛ̝ː] grene, kræse
// [e] læst
// [ɛ] bær
// [a] række
// [ɑ̈] kræft
// [eː] mæle, bære
// [æː] græde
// [æ] malle
// [ɑ̈] takke, var
// [ɑ̈ː] arne, trane, har
// [ɛː] male
// [y] lyt
// [yː] kyle
// [ø] kys
// [œ̝] grynt, høns, høne
// [ɶ̝] drøv, grøn
// [ɒ̽] tøj, måtte, fatter, ture, turer
// [øː] køle
// [œ̝ː] røbe
// [œ] gør
// [œː] gøre
// [u] guld, brusk
// [uː] mule, ruse
// [o̝] sort
// [ɔ̽] ost
// [o̝ː] mole
// [ɒ̝] vor
// [ɒ̝ː] morse, tårne
// [ɔ̽ː] måle
// [ə] måle
// [ɪ] veje, jage
// [ʊ] have
// [ɹ̻̩ˠ] måned, bade
// [l̩] gammel, tale
// [n̩] håne, hesten
// [m̩] hoppen
// [ŋ̍] pakken