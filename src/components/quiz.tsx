"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Progress, QuizQuestion } from "@/types";

type Answer = boolean | "unsure";
type QuizProgress = { score: number; total: number; currentIndex: number; answers: Answer[]; completed: boolean };
type Resume = Progress["quizResume"];

async function loadProgress() {
  const response = await fetch("/api/progress", { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível recuperar o quiz.");
  return response.json() as Promise<Progress>;
}

export function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const { data: session, status } = useSession();
  const progress = useQuery({ queryKey: ["progress"], queryFn: loadProgress, enabled: Boolean(session), staleTime: 0 });
  if (!questions.length) return <Card>Nenhuma pergunta cadastrada.</Card>;
  if (status === "loading" || (session && progress.isPending)) return <Card className="mx-auto max-w-2xl animate-pulse">Recuperando seu progresso...</Card>;
  const resume = progress.data?.quizResume;
  const validResume = resume && resume.total === questions.length && resume.currentIndex < questions.length ? resume : null;
  return <QuizRunner key={validResume ? `resume-${validResume.currentIndex}` : "new"} questions={questions} initialResume={validResume} authenticated={Boolean(session)}/>;
}

function QuizRunner({ questions, initialResume, authenticated }: { questions: QuizQuestion[]; initialResume: Resume; authenticated: boolean }) {
  const [index, setIndex] = useState(initialResume?.currentIndex ?? 0);
  const [answers, setAnswers] = useState<Answer[]>(initialResume?.answers ?? []);
  const [selected, setSelected] = useState<Answer | null>(null);
  const finished = index >= questions.length;
  const score = answers.reduce((sum, answer, answerIndex) => sum + Number(answer === questions[answerIndex]?.scam), 0);
  const save = useMutation({
    mutationFn: async (value: QuizProgress) => {
      const response = await fetch("/api/progress/quiz", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value), keepalive: true });
      if (!response.ok) throw new Error("Não foi possível salvar o progresso do quiz.");
      return response.json() as Promise<{ completed: boolean }>;
    },
    onSuccess: (result) => { if (result.completed) toast.success("Quiz concluído e salvo no seu progresso."); },
    onError: (error) => toast.error(error.message),
  });

  if (finished) return <Card className="mx-auto max-w-2xl text-center">
    <p className="eyebrow">Atividade concluída</p><h2 className="mt-3 text-3xl font-black">Você acertou {score} de {questions.length}</h2><p className="muted mt-3">Seu resultado foi registrado. Você pode praticar novamente quando quiser.</p>
    {authenticated && <p className={`quiz-save-status ${save.isError ? "error" : ""}`} role="status">{save.isPending && "Salvando resultado..."}{save.isSuccess && "Quiz concluído e salvo."}{save.isError && "O salvamento falhou. Tente novamente."}</p>}
    {authenticated && save.isError && <Button className="mt-6" onClick={() => save.mutate({ score, total: questions.length, currentIndex: questions.length, answers, completed: true })}>Tentar salvar novamente</Button>}
    <Button className="mt-6 ml-3" variant="secondary" onClick={() => { setIndex(0); setAnswers([]); setSelected(null); save.reset(); }}>Praticar novamente</Button>
  </Card>;

  const question = questions[index];
  const correct = selected === question.scam;
  function answerQuestion(answer: Answer) {
    setSelected(answer);
    if (!authenticated) return;
    const nextAnswers = [...answers, answer];
    const nextIndex = index + 1;
    const nextScore = nextAnswers.reduce((sum, item, answerIndex) => sum + Number(item === questions[answerIndex]?.scam), 0);
    save.mutate({ score: nextScore, total: questions.length, currentIndex: nextIndex, answers: nextAnswers, completed: nextIndex === questions.length });
  }

  function retrySave() {
    if (selected === null) return;
    const nextAnswers = [...answers, selected];
    const nextIndex = index + 1;
    const nextScore = nextAnswers.reduce((sum, item, answerIndex) => sum + Number(item === questions[answerIndex]?.scam), 0);
    save.mutate({ score: nextScore, total: questions.length, currentIndex: nextIndex, answers: nextAnswers, completed: nextIndex === questions.length });
  }

  function nextQuestion() {
    if (selected === null) return;
    if (authenticated && !save.isSuccess) return;
    const nextAnswers = [...answers, selected];
    const nextIndex = index + 1;
    setAnswers(nextAnswers); setSelected(null); setIndex(nextIndex); if (nextIndex < questions.length) save.reset();
  }

  return <Card className="mx-auto max-w-2xl">
    {initialResume && index === initialResume.currentIndex && <p className="quiz-resume-note">Continuando de onde você parou</p>}
    <div className="flex items-center justify-between gap-4"><p className="eyebrow">Situação {index + 1} de {questions.length}</p><span className="text-sm font-bold">{question.sender}</span></div>
    <div className="my-6 rounded-2xl bg-slate-100 p-5 text-lg leading-8">{question.message}</div>
    {selected === null ? <div className="grid gap-3 sm:grid-cols-2"><Button onClick={() => answerQuestion(true)}>É golpe</Button><Button variant="secondary" onClick={() => answerQuestion(false)}>Parece seguro</Button><Button variant="ghost" className="sm:col-span-2" onClick={() => answerQuestion("unsure")}>Não tenho certeza</Button></div> : <div><div className={`quiz-feedback ${correct ? "correct" : "incorrect"}`} role="status"><p className="font-black">{correct ? "Isso mesmo!" : "Vamos entender juntos."}</p><p className="mt-2 leading-7">{question.explanation}</p></div><Button className={`quiz-next mt-5 w-full ${correct ? "correct" : "incorrect"}`} disabled={authenticated && !save.isSuccess} onClick={nextQuestion}>{save.isPending ? "Salvando progresso..." : index + 1 === questions.length ? "Concluir quiz" : "Próxima situação"}</Button></div>}
    {authenticated && save.isError && <div className="mt-4"><p className="text-sm font-bold text-red-700">Não foi possível salvar a última resposta.</p><Button className="mt-3" variant="secondary" onClick={retrySave}>Tentar salvar novamente</Button></div>}
  </Card>;
}
