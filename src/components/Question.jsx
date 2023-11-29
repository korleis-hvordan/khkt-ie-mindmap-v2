import { useState } from "react";

import { Checkbox, Stack, Paper, Title, Button } from "@mantine/core";
import { useDidUpdate } from "@mantine/hooks";

function Question({ q }) {
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);
  const [c4, setC4] = useState(false);

  useDidUpdate(() => {
    if (c1) {
      setC2(false);
      setC3(false);
      setC4(false);
    }
  }, [c1]);

  useDidUpdate(() => {
    if (c2) {
      setC1(false);
      setC3(false);
      setC4(false);
    }
  }, [c2]);

  useDidUpdate(() => {
    if (c3) {
      setC2(false);
      setC1(false);
      setC4(false);
    }
  }, [c3]);

  useDidUpdate(() => {
    if (c4) {
      setC2(false);
      setC3(false);
      setC1(false);
    }
  }, [c4]);

  return (
    <Paper sx={{ boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px' }} m="sm" p="sm" pl="lg" radius="lg">
      <Title order={4}>{q.question}</Title>
      <Stack spacing="lg" my="md">
        <Checkbox checked={c1} onChange={e => setC1(e.currentTarget.checked)} label={q.answer[0]}
          radius="xl"
        />
        <Checkbox checked={c2} onChange={e => setC2(e.currentTarget.checked)} label={q.answer[1]}
          radius="xl"
        />
        <Checkbox checked={c3} onChange={e => setC3(e.currentTarget.checked)} label={q.answer[2]}
          radius="xl"
        />
        <Checkbox checked={c4} onChange={e => setC4(e.currentTarget.checked)} label={q.answer[3]}
          radius="xl"
        />
      </Stack>
      <Button radius="xl"
        onClick={() => {
          if (c1) {
            alert('Đáp án đúng');
          }
          else {
            alert('Đáp án sai');
          }
        }}
      >Kiểm tra</Button>
    </Paper>
  );
}

export default Question;