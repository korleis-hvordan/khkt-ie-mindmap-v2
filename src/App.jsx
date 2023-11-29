import './App.css';

import { useEffect, useState } from 'react';
import { ActionIcon, Button, Group, MantineProvider, Modal, SimpleGrid, Stack, TextInput } from '@mantine/core';
import { useDisclosure, useViewportSize } from '@mantine/hooks';
import { IconX } from '@tabler/icons-react';

import Mindmap from './components/Mindmap';
import MindmapPreview from './components/MindmapPreview';

function App() {
  const [opened, { open, close }] = useDisclosure(false);

  const [name, setName] = useState('');

  const [mindmapList, setMml] = useState([]);
  
  const [currId, setCurrId] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8080/api/v1/file', {
      method: "GET", 
      headers: { "Content-Type": "application/json" },
    })
    .then(res => res.json())
    .then(json => setMml(json.content.map(e => {
      return {
        preview: 
          <MindmapPreview name={e.title} setSmm={setSmm} id={e.id}
            setMml={setMml} setCurrId={setCurrId}
          />,
        id: e.id,
        title: e.title
      };
    })))
  }, []);

  const viewport = useViewportSize();

  const [showMindmap, setSmm] = useState(false);

  return (
    <MantineProvider theme={{ fontFamily: 'Montserrat' }}>
      {!showMindmap &&
        <>
          <Button pos="fixed" top={15} right={15} fz="lg" sx={{ zIndex: 99999 }}
            onClick={open}
          >
            Tạo mới
          </Button>
          <Modal opened={opened} centered radius="lg"
            withCloseButton={false} padding="md" shadow="xl" lockScroll={false}
            onClose={close}
          >
            <Group position="apart">
              <ActionIcon radius="xl" size="lg"
                onClick={close}
              >
                <IconX size="1.5rem" />
              </ActionIcon>
              <Button radius="xl" size="lg" compact color="pink.6"
                disabled={!name.trim().length}
                onClick={async () => {
                  const res = await fetch('http://localhost:8080/api/v1/file', {
                    method: "POST", 
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: name })
                  });
                  
                  if (res.status !== 200) {
                    alert('error');
                    return;
                  }

                  const json = await res.json();

                  fetch(`http://localhost:8080/api/v1/mindmap/${json.id}`, {
                    method: "POST", 
                    headers: { "Content-Type": "application/json" }
                  });

                  fetch(`http://localhost:8080/api/v1/document/${json.id}`, {
                    method: "POST", 
                    headers: { "Content-Type": "application/json" }
                  });
                  
                  setMml(curr => [...curr,
                    {
                      preview: 
                        <MindmapPreview name={name} setSmm={setSmm} id={json.id}
                          setMml={setMml} setCurrId={setCurrId}
                        />,
                      id: json.id,
                      title: name
                    }
                  ]);
                  
                  setName('');
                  close();
                }}
              >Tạo</Button>
            </Group>
            <TextInput mt="md" placeholder="Mindmap name" label="Name" size="md"
              value={name} onChange={e => setName(e.currentTarget.value)}
            />
          </Modal>
          <Stack align="center" py={50} px={100}>
            <SimpleGrid cols={Math.floor(viewport.width / 350)} spacing={50} p="xl">
              {mindmapList.map(e => e.preview)}
            </SimpleGrid>
          </Stack>
        </>}
      {showMindmap && <Mindmap currId={currId} setSmm={setSmm} />}
    </MantineProvider>
  );
}

export default App;