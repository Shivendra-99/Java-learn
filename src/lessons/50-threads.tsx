import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { OutputPredictor } from "@/components/lesson/output-predictor"
import { Quiz } from "@/components/lesson/quiz"
import { StepFlowDiagram } from "@/components/diagram/step-flow-diagram"
import { CircleCheck, Clock, Lock, Play, Pause, Sparkles } from "lucide-react"

const creating = `// 1. Implement Runnable — preferred: your class stays free to extend something
Runnable task = () -> System.out.println("running on " + Thread.currentThread().getName());
Thread t = new Thread(task, "worker-1");
t.start();          // start(), NOT run()

// 2. Extend Thread — rarely the right choice
class Worker extends Thread {
    @Override public void run() { ... }
}
new Worker().start();

// 3. In practice: don't create threads directly at all
ExecutorService pool = Executors.newFixedThreadPool(4);
pool.submit(task);`

const startVsRun = `public class StartOrRun {
    public static void main(String[] args) {
        Runnable task = () -> System.out.println(Thread.currentThread().getName());

        new Thread(task, "worker").run();     // ?
        new Thread(task, "worker").start();   // ?
    }
}`

const lifecycle = `NEW            created, not yet started
RUNNABLE       eligible to run — the OS decides when it actually gets a CPU
BLOCKED        waiting to acquire a monitor lock held by another thread
WAITING        waiting indefinitely: wait(), join(), park()
TIMED_WAITING  waiting with a deadline: sleep(n), wait(n), join(n)
TERMINATED     run() has returned or thrown

// Thread.getState() reports these — and a thread dump is
// mostly a list of which threads are in which state, and why.`

const coordination = `Thread worker = new Thread(this::process);
worker.start();

worker.join();                 // block until it finishes
worker.join(5000);             // ...or until 5 seconds pass
worker.isAlive();

Thread.sleep(1000);            // pause THIS thread; does not release any lock
Thread.currentThread().getName();

worker.setDaemon(true);        // must be set BEFORE start()
// A daemon thread does not keep the JVM alive: when only daemon
// threads remain, the JVM exits without waiting for them.`

const interruption = `// Interruption is cooperative — a request, not a kill
Thread worker = new Thread(() -> {
    while (!Thread.currentThread().isInterrupted()) {
        doChunkOfWork();
    }
    cleanUp();
});
worker.start();
worker.interrupt();            // sets the flag; the thread decides what to do

// Blocking methods throw InterruptedException instead of setting the flag —
// and throwing CLEARS it, which is why you must restore it:
try {
    Thread.sleep(1000);
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();     // restore the flag
    return;                                 // and stop what you were doing
}

// Thread.stop() is removed. There is no safe way to kill a thread
// from outside — it could be holding a lock, mid-update.`

const daemonExample = `// Why daemon status matters
Thread nonDaemon = new Thread(() -> {
    while (true) { /* forever */ }
});
nonDaemon.start();
// main returns... and the JVM does NOT exit. The process hangs.

Thread daemon = new Thread(() -> {
    while (true) { /* forever */ }
});
daemon.setDaemon(true);
daemon.start();
// main returns and the JVM exits immediately, abandoning the thread.`

export default function ThreadsLesson() {
  return (
    <>
      <p>
        A thread is an independent path of execution with its own stack, sharing the heap with every other thread in
        the process. That sharing is the whole point and the whole problem: it's how threads cooperate, and it's why
        concurrency is hard.
      </p>

      <h2>Creating one</h2>
      <CodeBlock language="java" filename="three ways, one recommendation" code={creating} />
      <Callout variant="warning" title="start() creates a thread; run() does not">
        <code>run()</code> is an ordinary method call — it executes the body on the <em>current</em> thread and
        nothing concurrent happens. <code>start()</code> asks the JVM for a new thread which then calls{" "}
        <code>run()</code>. Calling <code>start()</code> twice throws <code>IllegalThreadStateException</code>: a
        thread object is not reusable.
      </Callout>

      <OutputPredictor
        question="What thread names get printed, and in what order?"
        code={startVsRun}
        options={[
          { id: "a", text: "worker\nworker" },
          { id: "b", text: "main\nworker" },
          { id: "c", text: "worker\nmain" },
          { id: "d", text: "main\nmain" },
        ]}
        correctId="b"
        explanation={
          <p>
            The first line calls <code>run()</code> directly, so the task executes on the calling thread and prints
            "main" — the <code>Thread</code> object was created and never started. The second calls{" "}
            <code>start()</code>, which spawns a real thread named "worker". It's the single most common beginner
            mistake in Java concurrency, and it fails silently: the code works, just without any concurrency.
          </p>
        }
      />

      <h2>The lifecycle</h2>
      <StepFlowDiagram
        title="Thread states, and what moves between them"
        steps={[
          {
            id: "new",
            label: "NEW",
            detail: "The Thread object exists but start() has not been called. Nothing is scheduled and no OS thread exists yet.",
            icon: Sparkles,
          },
          {
            id: "runnable",
            label: "RUNNABLE",
            detail:
              "Eligible to run. Note this covers both 'currently executing' and 'waiting for a CPU' — Java does not distinguish them, because the OS scheduler owns that decision.",
            icon: Play,
          },
          {
            id: "blocked",
            label: "BLOCKED",
            detail: "Trying to enter a synchronized block whose lock another thread holds. It will resume automatically when the lock is released.",
            icon: Lock,
            tone: "warning",
          },
          {
            id: "waiting",
            label: "WAITING",
            detail:
              "Waiting indefinitely for another thread to act: wait(), join(), or LockSupport.park(). Only a notify, an interrupt, or the joined thread finishing will release it.",
            icon: Pause,
            tone: "warning",
          },
          {
            id: "timed",
            label: "TIMED_WAITING",
            detail: "The same, but with a deadline: sleep(n), wait(n), join(n), or a timed lock acquisition. It resumes on its own when the time expires.",
            icon: Clock,
          },
          {
            id: "terminated",
            label: "TERMINATED",
            detail: "run() has returned or thrown. The thread cannot be restarted — calling start() again throws IllegalThreadStateException.",
            icon: CircleCheck,
            tone: "success",
          },
        ]}
      />
      <CodeBlock language="text" filename="Thread.State" code={lifecycle} />

      <AnalogyCard title="Extra cooks in one kitchen.">
        Each cook works independently — their own hands, their own station, their own list of steps. But they share
        the fridge, the oven and the worktop, and that's exactly where the trouble starts: two cooks reaching for
        the same pan, or one putting something away while the other is still using it. Adding cooks speeds up a
        large order and makes a small one slower, because now they have to coordinate.
      </AnalogyCard>

      <h2>Coordinating</h2>
      <CodeBlock language="java" filename="join, sleep, daemon" code={coordination} />
      <CodeBlock language="java" filename="daemon threads and JVM shutdown" code={daemonExample} />

      <h2>Interruption</h2>
      <CodeBlock language="java" filename="cooperative cancellation" code={interruption} />
      <p>
        There is no way to forcibly stop a thread. <code>Thread.stop()</code> was deprecated for decades and is now
        removed, because killing a thread mid-update could leave shared state permanently corrupted. Cancellation is
        a request the target must be written to notice.
      </p>

      <CommonMistake
        title="swallowing InterruptedException"
        wrong={`try {
    Thread.sleep(1000);
} catch (InterruptedException e) {
    // ignored
}
// The interrupt flag was cleared by the throw and never restored,
// so every layer above this now believes nobody asked to cancel.
// The task keeps running, and shutdown hangs.`}
        right={`try {
    Thread.sleep(1000);
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();   // restore the flag
    return;                               // and actually stop
}

// Or, if you can, just let it propagate:
void doWork() throws InterruptedException { ... }`}
        explanation={
          <p>
            Throwing <code>InterruptedException</code> clears the interrupt flag. If you catch it and do nothing,
            the cancellation request has been destroyed — code higher up the stack checking{" "}
            <code>isInterrupted()</code> sees false and carries on. Either restore the flag and stop, or declare the
            exception and let the caller decide.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A thread is a separate line of work running at the same time as the rest of your program. Create one
            with a task, call <code>start()</code>, and it runs alongside <code>main</code>. Threads share the same
            objects, which is useful and also why two threads changing the same thing at once causes bugs.
          </p>
        }
        developer={
          <p>
            Each thread gets its own stack (sized with <code>-Xss</code>) and shares the heap. Platform threads map
            one-to-one to OS threads, so they cost roughly a megabyte of stack and a context switch to schedule —
            which is why pools exist and why virtual threads were added. State transitions are visible via{" "}
            <code>getState()</code> and in thread dumps. Interruption is cooperative: the flag is set, blocking
            methods throw <code>InterruptedException</code> and clear it, and correct code restores it.
          </p>
        }
        interview={
          <p>
            Near-certain questions: <code>start()</code> versus <code>run()</code>; <code>Runnable</code> versus
            extending <code>Thread</code> (composition, and you keep your one superclass); the six states; and how
            to stop a thread — cooperatively, because <code>stop()</code> is unsafe and removed. Handling{" "}
            <code>InterruptedException</code> correctly is a strong signal, since most candidates swallow it.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why is implementing Runnable usually preferred over extending Thread?"
        options={[
          { id: "a", text: "Runnable tasks run faster" },
          { id: "b", text: "It separates the task from the mechanism, leaves your one superclass slot free, and the task can be handed to an executor" },
          { id: "c", text: "Thread cannot be subclassed" },
          { id: "d", text: "Runnable is thread-safe by default" },
        ]}
        correctId="b"
        explanation="A Runnable is a piece of work; a Thread is a way of running it. Keeping them separate means the same task can go to a pool, a virtual thread, or a direct call — and your class is still free to extend something meaningful. There is no performance difference."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Watch the states change"
        hint={
          <p>
            Have a monitoring thread poll <code>worker.getState()</code> every 50ms and print it, while the worker
            sleeps, then contends for a lock, then finishes.
          </p>
        }
      >
        Write a worker thread that sleeps, then blocks on a lock another thread holds, then completes — and a second
        thread that prints its state throughout. Confirm you observe <code>TIMED_WAITING</code>,{" "}
        <code>BLOCKED</code> and <code>TERMINATED</code>. Then interrupt it during the sleep and check whether the
        flag is set inside the catch block, before and after you restore it.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="How do you stop a running thread in Java?"
        answer={
          <p>
            You ask it to stop; you can't make it. <code>Thread.stop()</code> existed, was deprecated almost
            immediately, and has now been removed, because it threw an asynchronous exception at an arbitrary point
            — potentially while the thread held a lock and had a shared object half-updated, leaving corrupted state
            behind a lock that was then released. The supported mechanism is <strong>interruption</strong>:{" "}
            <code>thread.interrupt()</code> sets a flag, and the thread is expected to check{" "}
            <code>Thread.currentThread().isInterrupted()</code> in its loop and return cleanly. Blocking methods
            like <code>sleep</code>, <code>wait</code> and <code>join</code> respond by throwing{" "}
            <code>InterruptedException</code> — which <em>clears</em> the flag, so a handler must either restore it
            with <code>Thread.currentThread().interrupt()</code> and stop, or let the exception propagate.
            Swallowing it is the classic bug: the cancellation request disappears and shutdown hangs. For tasks in
            an executor, <code>Future.cancel(true)</code> and <code>shutdownNow()</code> interrupt on your behalf.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "start() spawns a thread; run() just calls the method on the current one.",
          "Prefer Runnable to extending Thread, and an executor to either.",
          "Six states: NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED.",
          "Daemon threads don't keep the JVM alive; setDaemon must be called before start.",
          "Cancellation is cooperative — interrupt sets a flag, and InterruptedException clears it, so restore it.",
        ]}
      />
    </>
  )
}
