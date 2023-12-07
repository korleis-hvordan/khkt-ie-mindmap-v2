import { useEffect, useState } from 'react';
import { ActionIcon, Box, Image, Paper, Text } from '@mantine/core';

import preview from '../assets/preview.jpg';
import { IconX } from '@tabler/icons-react';

function MindmapPreview({ name, setSmm, id, setMml, setCurrId }) {
  const [image, setImage] = useState(null);

  useEffect(() => {
    fetch(preview).then(res => res.blob()).then(img => setImage(img));
  }, []);

  return (
    <Paper className="preview" pos="relative"
      sx={{
        '&:hover': {
          cursor: 'pointer'
        }
      }}
      onClick={() => {
        setSmm(true);
        setCurrId(id);
      }}
    >
      <Box sx={{ overflow: 'hidden' }}>
        <Text pos="absolute" top="50%" left="50%" fz="1.5rem"
          sx={{
            zIndex: 9999,
            transform: 'translate(-50%, -50%)'
          }}
        >{name}</Text>
        <Image src={image ? URL.createObjectURL(image) : ''} sx={{ opacity: 0.4 }} />
      </Box>
      <ActionIcon className="x-button" radius="xl" variant="filled" color="red" size="xl"
        pos="absolute" top={-20} right={-20}
        onClick={e => {
          e.stopPropagation();
          fetch(`http://localhost:8080/api/v1/file/${id}`, {
            method: "DELETE", 
            headers: { "Content-Type": "application/json" }
          });
          setMml(curr => {
            const index = curr.findIndex(e => e.id === id);
            return curr.slice(0, index).concat(curr.slice(index + 1));
          });
        }}
      >
        <IconX />
      </ActionIcon>
    </Paper>
  );
}

export default MindmapPreview;