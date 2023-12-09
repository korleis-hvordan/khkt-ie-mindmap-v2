import { forwardRef, useEffect, useRef, useState } from 'react';

import { ActionIcon, AppShell, Box, Button, Center, Checkbox, Dialog, Divider, Drawer, FileButton, Group, Image, List, Loader, MantineProvider, Modal, Navbar, Paper, ScrollArea, Select, Stack, Text, TextInput, Title } from '@mantine/core';
import { useDidUpdate, useDisclosure, useViewportSize } from '@mantine/hooks';
import { useForm } from '@mantine/form';

import { IconArrowBackUp, IconCheck, IconDeviceFloppy, IconPencilPlus, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { IconSettings } from '@tabler/icons-react';

import Canvas from './Canvas';
import Node from './Node';
import NodeM from './NodeM'
import Editor from './Editor';
import Question from './Question';

import bg1 from '../assets/1.jpg';
import bg2 from '../assets/2.jpg';
import bg3 from '../assets/3.jpg';

const imgToBase64 = img => {
  if (!img) {
    return null;
  }

  if (typeof img === 'string') {
    return img;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(img);
    reader.onload = () => resolve(reader.result?.toString() || "");
    reader.onerror = error => reject(error);
  })
}

const dataToBlob = async (imageData) => {
  if (imageData === null) {
    return null;
  }
  return await (await fetch(imageData)).blob();
};

function Mindmap({ currId, setSmm }) {
  function makeNode(index, color, subject, body, file, width, offset) {
    return (
      window.ontouchstart !== undefined ?
        <NodeM index={index}
          pos={offset ?? { x: (viewport.width - 250)  / 2, y: viewport.height / 2 }}
          iColor={color} iSubject={subject} iBody={body} iFile={file} iWidth={width}
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
          pos={offset ?? { x: (viewport.width - 250) / 2 + scrollX, y: viewport.height / 2 + scrollY}}
          iColor={color} iSubject={subject} iBody={body} iFile={file} iWidth={width}
          setCn={setCn} setNl={setNl}
          nodeGraph={nodeGraph} setNg={setNg}
          connectMode={connectMode} setCm={setCm}
          setCs={setCs} setCt={setCt}
          disconnectMode={disconnectMode} setDm={setDm} setDs={setDs}
          editHandler={editHandler}
          ref={e => nodeRefs.current[index] = e}
          key={index}
        />
    );
  }

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
  const [currFont, setCf] = useState(null);

  const viewport = useViewportSize();

  const [f, setF] = useState(true);

  const [title, setTitle] = useState('');

  useEffect(() => {
    if (f && viewport.width !== 0 && viewport.height !== 0) {
      fetch(`http://localhost:8080/api/v1/file/${currId}`)
      .then(res => res.json())
      .then(async json => {
        if (json.document.content.length !== 0) {
          setDoc(URL.createObjectURL(new Blob([json.document.content], { type: "text/plain" })));
        }

        if (Object.keys(json.mindMap.content).length === 1) {
          setCf('Montserrat');

          const backgrounds = [bg1, bg2, bg3];
          fetch(backgrounds[Math.floor(Math.random() * 3)]).then(res => res.blob())
          .then(async bg => {
            setBg(bg)
            const newNode = makeNode(0, 'Red', json.title, '', null, 200);
            fetch(`http://localhost:8080/api/v1/mindmap/${currId}`, {
              method: "PUT", 
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: {
                  title: json.title,
                  font: 'Montserrat',
                  background: await imgToBase64(bg),
                  main: {
                    root: {
                      index: 0,
                      x: newNode.props.pos.x,
                      y: newNode.props.pos.y,
                      width: 200,
                      color: 'Red',
                      label: json.title,
                      subject: json.title,
                      body: '',
                      file: null,
                      children: []
                    }
                  },
                  other: []
                }
              })
            });
            
            setNl([newNode]);
          });
        }
        else {          
          let visited = [];
          let nodeList = [];
          let nodeGraph = [];

          async function dfs(parent, v) {
            visited[v.index] = true;

            if (parent !== null) {
              if (typeof(nodeGraph[v.index]) === 'object') {
                nodeGraph[v.index].add(parent.index);
              }
              else {
                nodeGraph[v.index] = new Set([parent.index]);
              }
    
              if (typeof(nodeGraph[parent.index]) === 'object') {
                nodeGraph[parent.index].add(v.index);
              }
              else {
                nodeGraph[parent.index] = new Set([v.index]);
              }
            }

            nodeList[v.index] = 
              makeNode(v.index, v.color, v.subject, v.body, v.file, v.width, { x: v.x, y: v.y });

            for (const x of v.children) {
              if (!visited[x.index]) {
                dfs(v, x);
              }
            }
          }

          dfs(null, json.mindMap.content.main.root);

          for (const x of json.mindMap.content.other) {
            dfs(null, x);
          }

          setNl(nodeList);
          setNg(nodeGraph);

          setBg(await dataToBlob(json.mindMap.content.background));
          setCf(json.mindMap.content.font);

          setQuestions(json.question.content);
          setFeedback(json.mindMap.feedback);
        }
        setTitle(json.title);
      });
      setF(false);
    }
  }, [viewport]);

  const [background, setBg] = useState(null);

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

  const [save, setSave] = useState(0);

  useDidUpdate(() => {(async () => {
    let json = {
      content: {
        title: title,
        font: currFont,
        background: await imgToBase64(background),
        main: {
          root: {
            index: 0,
            x: nodeRefs.current[0].getOffset().x,
            y: nodeRefs.current[0].getOffset().y,
            width: nodeRefs.current[0].getSize().width,
            color: nodeRefs.current[0].getColor(),
            label: nodeRefs.current[0].getSubject() + ". " + nodeRefs.current[0].getBody(),
            subject: nodeRefs.current[0].getSubject(),
            body: nodeRefs.current[0].getBody(),
            file: await imgToBase64(nodeRefs.current[0].getFile()),
            children: []
          }
        },
        other: []
      }
    }

    let visited = new Array(nodeList.length).fill(false);
    let cock = [];
    async function dfs(source, v) {
      visited[v] = true;

      if (!nodeGraph[v]) {
        return;
      }

      let prev = source === 0 ? json.content.main.root.children
        : json.content.other[json.content.other.findIndex(e => e.index === source)].children;
      if (v !== source) {
        for (let i = 0; i < cock.length; i++) {
          if (i === cock.length - 1) {
            prev.push({
              index : v,
              x: nodeRefs.current[v].getOffset().x,
              y: nodeRefs.current[v].getOffset().y,
              width: nodeRefs.current[v].getSize().width,
              color: nodeRefs.current[v].getColor(),
              label: nodeRefs.current[v].getSubject() + ". " + nodeRefs.current[v].getBody(),
              subject: nodeRefs.current[v].getSubject(),
              body: nodeRefs.current[v].getBody(),
              file: await imgToBase64(nodeRefs.current[v].getFile()),
              children: []
            });
            break;
          }
          prev = prev[prev.findIndex(e => e.index === cock[i + 1])].children;
        }
      }

      cock.push(v);
      for (const x of nodeGraph[v]) {
        if (!visited[x]) {
          await dfs(source, x);
        }
      }
      cock.pop();
    }

    while (true) {
      let start = -1;

      for (let i = 0; i < nodeList.length; i++) {
        if (nodeList[i] && !visited[i] && nodeGraph[i]) {
          start = i;
          break;
        }
      }
  
      if (start !== -1) {
        if (start !== 0) {
          json.content.other.push({
            index : start,
            x: nodeRefs.current[start].getOffset().x,
            y: nodeRefs.current[start].getOffset().y,
            width: nodeRefs.current[start].getSize().width,
            color: nodeRefs.current[start].getColor(),
            label: nodeRefs.current[start].getSubject() + ". " + nodeRefs.current[start].getBody(),
            subject: nodeRefs.current[start].getSubject(),
            body: nodeRefs.current[start].getBody(),
            file: await imgToBase64(nodeRefs.current[start].getFile()),
            children: []
          });
        }
        await dfs(start, start);
        cock = [];
      }
      else {
        break;
      }        
    }

    for (let i = 1; i < nodeList.length; i++) {
      if (nodeList[i] && !nodeGraph[i]) {
        json.content.other.push({
          index : i,
          x: nodeRefs.current[i].getOffset().x,
          y: nodeRefs.current[i].getOffset().y,
          width: nodeRefs.current[i].getSize().width,
          color: nodeRefs.current[i].getColor(),
          label: nodeRefs.current[i].getSubject() + ". " + nodeRefs.current[i].getBody(),
          subject: nodeRefs.current[i].getSubject(),
          body: nodeRefs.current[i].getBody(),
          file: await imgToBase64(nodeRefs.current[i].getFile()),
          children: []
        })
      }
    }

    const [_, __] = await Promise.all([fetch(`http://localhost:8080/api/v1/mindmap/${currId}`, {
      method: "PUT", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json)
    }),
    fetch(`http://localhost:8080/api/v1/file/${currId}`, {
      method: "PUT", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title })
    })]);

    fetch(`http://localhost:8080/api/v1/file/check-mindmap/${currId}`,{
      headers: { "Content-Type": "plain/text" }
    })
    .then(res => res.text()).then(text => {
      setFeedback(text);
      setLoad3(false);
    });

    setLoad(false);

  })()}, [save]);

  const [active, setActive] = useState("mindmap");

  const [doc, setDoc] = useState(null);

  const [load, setLoad] = useState(false);

  const [checkOpened, check] = useDisclosure(false);

  const [questions, setQuestions] = useState([]);

  const [moreOpened, more] = useDisclosure(false);

  const [ques, setQues] = useState("");
  const form = useForm({
    initialValues: {
      choice: ''
    },
    validate: {
      choice: value => value.length ? null : "Không thể bỏ trống!"
    }
  });
  const [choices, setChoices] = useState([]);
  const [cCheck, setCCheck] = useState([]);
  const [currChoice, setCurrChoice] = useState(null);

  useDidUpdate(() => {
    setCCheck(curr => {
      const copy = curr.slice();
      for (let i = 0; i < copy.length; i++) {
        if (i !== currChoice) {
          copy[i] = false;
        }
      }
      return copy;
    });
  }, [currChoice]);

  const [load2, setLoad2] = useState(false);

  const [feedback, setFeedback] = useState(null);
  const [load3, setLoad3] = useState(false);

  return (
    <MantineProvider
      theme={{
        fontFamily: currFont
      }}
    >
      <AppShell
        padding={0}
        navbar={
          <Navbar width={{ base: 250 }} p="xs">
            <Stack w="100%" h="100%" justify="space-around">
              <Paper h="25%" shadow="xl" radius="xl" bg="gray.0"
                sx={{
                  '&:hover': {outline: '2px solid darkgray', cursor: 'pointer' },
                  ...(active === "sg" && { outline: '2px solid gray' })
                }}
                onClick={() => setActive("sg")}
              >
                <Center h="100%" fz="1.5rem">Tài liệu</Center>
              </Paper>
              <Paper h="25%" shadow="xl" radius="xl" bg="gray.0"
                sx={{
                  '&:hover': { outline: '2px solid darkgray', cursor: 'pointer' },
                  ...(active === "questions" && { outline: '2px solid gray' })
                }}
                onClick={() => setActive("questions")}
              >
                <Center h="100%" fz="1.5rem">Câu hỏi</Center>
              </Paper>
              <Paper h="25%" shadow="xl" radius="xl" bg="gray.0"
                sx={{
                  '&:hover': { outline: '2px solid darkgray', cursor: 'pointer' },
                  ...(active === "mindmap" && { outline: '2px solid gray' })
                }}
                onClick={() => setActive("mindmap")}
              >
                <Center h="100%" fz="1.5rem">Mindmap</Center>
              </Paper>
            </Stack>
          </Navbar>
        }
        styles={{
          main: {
            backgroundColor: 'whitesmoke'
          }
        }}
      >
        <ActionIcon size={50} variant="filled"
          pos="fixed" top={15} right={15}
          onClick={() => setSmm(false)}
          sx={{ zIndex: 1 }}
        >
          <IconArrowBackUp size={40} />
        </ActionIcon>
        <Box sx={{ display: active === "mindmap" ? 'block' : 'none' }} pos="relative">
          <Canvas background={background} nodeList={nodeList} nodeGraph={nodeGraph} setNg={setNg}
            nodeRefs={nodeRefs} currNode={currNode}
            disconnectMode={disconnectMode} setDm={setDm}
            disconnectSource={disconnectSource}
          />
          <Drawer.Root opened={settingsOpened} onClose={close} title="Settings" position="right">
            <Drawer.Overlay />
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title><Text fz="xl">Cài đặt</Text></Drawer.Title>
                <Drawer.CloseButton />
              </Drawer.Header>
              <Drawer.Body>
                <Title order={4}>Giao diện</Title>
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
                    <Text>Hình nền</Text>
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
                <Title order={4}>Thông tin</Title>
                <Paper radius="lg" bg="gainsboro" my="md" p="md">
                  <Group position="apart">
                    <Text>Tiêu đề</Text>
                    <TextInput placeholder="Title" value={title} radius="xl"
                      onChange={e => setTitle(e.currentTarget.value)}
                      styles={theme => ({
                        input: {
                          fontSize: theme.fontSizes.lg
                        }
                      })}
                    />
                  </Group>
                </Paper>
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Root>
          <ActionIcon size={50} variant="filled"
            pos="fixed" top={15} right={15 + 50 + 15}
            onClick={open}
          >
            <IconSettings size={40} />
          </ActionIcon>
          <ActionIcon size={50} variant="filled"
            pos="fixed" top={15} right={15 + 50 + 15 + 50 + 15}
            onClick={() => { setLoad(true); setLoad3(true); setSave(curr => !curr); }}
          >
            {load ? <Loader color="gray.0" variant="dots" /> : <IconDeviceFloppy size={40} />}
          </ActionIcon>
          <ActionIcon size={50} variant="filled"
            pos="fixed" top={15} right={15 + 50 + 15 + 50 + 15 + 50 + 15}
            onClick={check.open}
          >
            <IconCheck size={40} />
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
          <Modal opened={checkOpened} centered radius="lg" onClose={check.close}>
            <Center>
              {load3 ? <Loader color="gray" /> : feedback ?? "Mindmap quá nhỏ để có thể so sánh"}
            </Center>
          </Modal>
          <Editor
            ref={newRef} opened={newOpened} openHandler={newHandler}
            iColor="Red" iSubject="" iBody="" iFile={null}
            colors={colors} setColors={setColors}
            customColor={customColor} setCc={setCc}
            useCustom={useCustom} setUc={setUc}
            action="Tạo"
            actionOnClick={() => {
              setNl(curr =>
                [...curr, makeNode(
                    nodeList.length,
                    newRef.current.getColor(),
                    newRef.current.getSubject(),
                    newRef.current.getBody(),
                    newRef.current.getFile(),
                    200
                  )
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
            action="Cập nhật"
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
            position={{ bottom: 20, right: 20 }}
          >
            <Group>
              Pick a post to connect to
              <Button fz="xl" onClick={() => setCm(false)}>Cancel</Button>
            </Group>
          </Dialog>
          <Dialog opened={disconnectMode} radius="lg" py="xs" fz="xl" w="fit-content"
            position={{ bottom: 20, right: 20 }}
          >
            <Group>
              Pick a post to disconnect from
              <Button fz="xl" onClick={() => setDm(false)}>Cancel</Button>
            </Group>
          </Dialog>
        </Box>
        <Paper m={15} radius="xl" p="sm" mih="calc(100% - 2 * 15px)"
          sx={{
            display: active === "sg" ? 'flex' : 'none',
            alignItems: 'center', justifyContent: 'center'
          }}
        >
          {doc
            ?
              <>
                <ActionIcon size={50} variant="filled"
                  pos="fixed" top={15} right={15 + 50 + 15} sx={{ zIndex: 1 }}
                  onClick={() => {
                    setDoc(null);
                    setQuestions([]);
                    fetch(`http://localhost:8080/api/v1/document/${currId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ content: "" })
                    });
                    fetch(`http://localhost:8080/api/v1/question/q/all/${currId}`, {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" }
                    });
                  }}
                >
                  <IconTrash size={40} />
                </ActionIcon>
                <ScrollArea w="100%" offsetScrollbars p="sm">
                  <zero-md src={doc}></zero-md>
                </ScrollArea>
              </>
            :
              <FileButton variant="outline"
                onChange={e => {
                  const url = URL.createObjectURL(e);
                  setDoc(url);
                  fetch(url).then(res => res.text()).then(text => {
                    fetch(`http://localhost:8080/api/v1/document/${currId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ content: text })
                    })
                    .then(_ => {
                      fetch(`http://localhost:8080/api/v1/file/generate-question/${currId}`, {
                        headers: { "Content-Type": "application/json" }
                      })
                      .then(res => res.json())
                      .then(json => setQuestions(curr => curr.slice().concat(json)));
                    });
                  });
                }}
                accept=".md"
              >
                {props => <Button {...props}>Đăng Tài Liệu</Button>}
              </FileButton>
          }
        </Paper>
        <Paper m={15} radius="xl" p="md" mih="calc(100% - 2 * 15px)"
          sx={{
            display: active === "questions" ? 'flex' : 'none',
            flexDirection: "column"
          }}
        >
          {!questions.length ?
            <Center sx={{ flex: 1 }}>{doc ? <Loader color="gray" /> : "Hãy đăng tài liệu lên!"}</Center>
            :
            <>
              <ActionIcon size={50} variant="filled"
                pos="fixed" top={15} right={15 + 50 + 15} sx={{ zIndex: 1 }}
                onClick={more.open}
              >
                <IconPencilPlus size={40} />
              </ActionIcon>
              <ActionIcon size={50} variant="filled"
                pos="fixed" top={15} right={15 + 50 + 15 + 15 + 50} sx={{ zIndex: 1 }}
                onClick={() => {
                  setLoad2(true);

                  fetch(`http://localhost:8080/api/v1/file/generate-question/${currId}`, {
                    headers: { "Content-Type": "application/json" }
                  })
                  .then(res => res.json())
                  .then(json => {
                    setQuestions(curr => curr.slice().concat(json));
                    setLoad2(false);
                  });
                }}
              >
                {load2 ? <Loader color="gray.0" variant="dots" /> : <IconPlus size={40} />}
              </ActionIcon>
              <Modal opened={moreOpened} centered radius="lg" onClose={more.close}
                withCloseButton={false} padding="md" shadow="xl" lockScroll={false}
              >
                <Group position="apart">
                  <ActionIcon radius="xl" size="lg"
                    onClick={more.close}
                  >
                    <IconX size="1.5rem" />
                  </ActionIcon>
                  <Button radius="xl" size="lg" compact color="pink.6"
                    disabled={!ques.trim().length || !choices.length || !cCheck.some(e => e)}
                    onClick={() => {
                      const answers = [choices[currChoice]];
                      for (let i = 0; i < choices.length; i++) {
                        if (i !== currChoice) {
                          answers.push(choices[i]);
                        }
                      }

                      fetch(`http://localhost:8080/api/v1/question/q/${currId}`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                          question: ques,
                          answers: answers
                        })
                      })
                      .then(res => res.json())
                      .then(json => {
                        more.close();
                        setQuestions(curr => [...curr, json]);
                        setQues("");
                        form.setFieldValue('choice', '');
                        setCCheck([]);
                        setChoices([]);
                        setCurrChoice(null);
                      });
                    }}
                  >Tạo</Button>
                </Group>
                <TextInput mt="md" placeholder="Câu hỏi" label="Câu hỏi" size="md"
                  value={ques} onChange={e => setQues(e.currentTarget.value)}
                />
                <form onSubmit={form.onSubmit(val => {
                    form.setFieldValue('choice', '');
                    setChoices(curr => [...curr, val.choice]);
                  })}
                >
                  <Text mt="md">Thêm lựa chọn</Text>
                  <TextInput placeholder="Lựa chọn" size="md"
                    {...form.getInputProps('choice')}
                  />
                  <Center mt="md"><Button type="submit">Thêm</Button></Center>
                  <List {...(choices.length && { mt: "md" })} center spacing="sm">
                    {choices.map((e, i) => 
                      <List.Item
                        icon={
                          <ActionIcon variant="filled" radius="xl" color="red"
                            onClick={() => {
                              setChoices(curr => {
                                const copy = curr.slice();
                                copy.splice(i, 1);
                                return copy;
                              });
                            }}
                          >
                            <IconX />
                          </ActionIcon>
                        }
                      >
                        <Checkbox labelPosition="left" label={e} radius="xl"
                          checked={cCheck[i]}
                          onChange={event => {
                            const checked = event.currentTarget.checked;
                            setCurrChoice(i);
                            setCCheck(curr => {
                              const copy = curr.slice();
                              copy[i] = checked;
                              return copy;
                            });
                          }}
                        />
                      </List.Item>
                    )}
                  </List>
                </form>
              </Modal>
            </>
          }
          {questions.map(e => <Question q={e} setQuestions={setQuestions} />)}
        </Paper>
      </AppShell>
    </MantineProvider>
  );
}

export default Mindmap;

// h₂ólyoes ĝʰmónes h₁léwdʰeroes somHóeskʷe gʷr̥Htóteh₂ty̥ h₃r̥ĝtẃ̥sw̥kʷe ĝn̥h₁yóntor. éybʰos dh₃tóy
// ménos k̂ḗrkʷe h₁stés h₂énteroeykʷe sm̥h₂éleyes bʰréh₂tr̥bʰos swé h₂éĝoyh₁n̥t.