import { useState } from "react";

import { Checkbox, Stack, Paper, Title, Button, Text } from "@mantine/core";
import { useDidUpdate } from "@mantine/hooks";

function Question({ q }) {
  const [ans, setAns] = useState([]);
  const [currAns, setCurrAns] = useState(null);

  const [res, setRes] = useState(null);

  useDidUpdate(() => {
    setAns(curr => {
      const copy = curr.slice();
      for (let i = 0; i < copy.length; i++) {
        if (i !== currAns) {
          copy[i] = false;
        }
      }
      return copy;
    });
  }, [currAns]);

  return (
    <Paper sx={{ boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px' }} m="sm" p="sm" pl="lg" radius="lg">
      <Title order={4}>{q.question}</Title>
      <Stack spacing="lg" my="md">
        {q.answers.map((e, i) =>
          <Checkbox key={i} checked={ans[i]} onChange={event => {
              const checked = event.currentTarget.checked;
              setCurrAns(i);
              setAns(curr => {
                const copy = curr.slice();
                copy[i] = checked;
                return copy;
              });
            }}
            label={e}
            radius="xl"
          />
        )}
      </Stack>
      {res ?
        <Text mb="md" color="green">Đáp án đúng!</Text>
        :
        res === false ?
        <Text mb="md" color="red">Đáp án sai!</Text>
        : null
      }
      <Button radius="xl"
        onClick={() => {
          let i = 0;
          for (; i < q.answers.length; i++) {
            if (ans[i]) {
              break;
            }
          }
          fetch(`http://localhost:8080/api/v1/question/q/check/${q.id}`,
            { method: "POST", headers: { "Content-Type": "plain/text" }, body: q.answers[i] })
          .then(res => res.json()).then(json => setRes(json))
        }}
      >Kiểm tra</Button>
    </Paper>
  );
}

export default Question;