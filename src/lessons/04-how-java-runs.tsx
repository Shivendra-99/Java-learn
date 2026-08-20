import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"
import { CompilePipeline } from "@/components/diagram/compile-pipeline"
import { StepFlowDiagram } from "@/components/diagram/step-flow-diagram"
import { Cpu, Download, Flame, Link2, Play, ShieldCheck, Zap } from "lucide-react"

const source = `public class Adder {
    int add(int a, int b) {
        return a + b;
    }
}`

const bytecode = `$ javac Adder.java
$ javap -c Adder

  int add(int, int);
    Code:
       0: iload_1        // push parameter a onto the operand stack
       1: iload_2        // push parameter b onto the operand stack
       2: iadd           // pop two ints, add them, push the result
       3: ireturn        // return the int on top of the stack`

const jitFlags = `# Watch the JIT make decisions
java -XX:+PrintCompilation Main

    113   1       3       java.lang.String::hashCode (49 bytes)
    118   2       3       java.util.ArrayList::add (25 bytes)
    241   7       4       com.example.Prices::total (18 bytes)   # tier 4 = fully optimised

# Force interpretation only, and watch it crawl
java -Xint Main`

export default function HowJavaRunsLesson() {
  return (
    <>
      <p>
        "Java is slow because it's interpreted" was true in 1997 and has been wrong for twenty-five years. What
        actually happens is stranger and more interesting: your code is compiled twice, by two different compilers,
        with the second one waiting to see how your program behaves before it commits to anything.
      </p>

      <CompilePipeline title="The path from your file to a running program" />

      <h2>Step one: javac, the ahead-of-time half</h2>
      <p>
        <code>javac</code> does the work that only needs doing once: parse the source, resolve every name, check
        every type, and emit bytecode. It does <em>not</em> optimise much — that's deliberate. Optimising here would
        bake in assumptions about a machine the compiler has never seen.
      </p>
      <CodeBlock language="java" filename="Adder.java" code={source} />
      <p>
        Bytecode is a stack machine's instruction set: there are no registers, just an operand stack that
        instructions push to and pop from. You can read it yourself with <code>javap</code>:
      </p>
      <CodeBlock language="bash" filename="javap -c Adder" code={bytecode} />
      <p>
        Four instructions, and each one is trivial. That simplicity is why a JVM is portable — implementing a few
        hundred small instructions on a new platform is achievable, and every Java program then runs there.
      </p>

      <h2>Step two: the JVM, at runtime</h2>
      <StepFlowDiagram
        title="What the JVM does with your .class file"
        steps={[
          {
            id: "load",
            label: "Load",
            detail:
              "The class loader finds Adder.class on the classpath and reads it into memory. Classes load lazily — the first time each one is actually needed, not at startup.",
            icon: Download,
          },
          {
            id: "verify",
            label: "Verify",
            detail:
              "The verifier proves the bytecode is safe: no stack underflow, no jumping into the middle of an instruction, no treating an int as a reference. Hand-crafted malicious bytecode is rejected here.",
            icon: ShieldCheck,
          },
          {
            id: "link",
            label: "Prepare & resolve",
            detail:
              "Static fields get their default values, and symbolic references to other classes are resolved to real ones — again lazily, the first time each reference is used.",
            icon: Link2,
          },
          {
            id: "init",
            label: "Initialise",
            detail:
              "Static initialisers and static field assignments run, exactly once per class, and the JVM guarantees this is thread-safe.",
            icon: Play,
          },
          {
            id: "interpret",
            label: "Interpret",
            detail:
              "Execution begins immediately, one bytecode instruction at a time. Slow per instruction, but it starts instantly with no compilation delay.",
            icon: Cpu,
          },
          {
            id: "profile",
            label: "Profile",
            detail:
              "While interpreting, the JVM counts method invocations and loop iterations, and records which types actually show up at each call site.",
            icon: Flame,
            tone: "warning",
          },
          {
            id: "jit",
            label: "JIT compile",
            detail:
              "Methods that cross a threshold get compiled to native machine code, using the profile to inline aggressively and speculate on types. This is where Java gets its speed.",
            icon: Zap,
            tone: "success",
          },
        ]}
      />

      <AnalogyCard title="A translator who starts interpreting live, then writes a script for the repeated parts.">
        A live interpreter can start the moment the speaker does — no preparation, but every sentence costs effort.
        If the speaker keeps repeating the same paragraph, a smart interpreter writes out a polished translation of
        that paragraph once and reads it thereafter. That's the JIT: interpret to start fast, then compile whatever
        turns out to be hot, using knowledge of what was actually said.
      </AnalogyCard>

      <h2>Why compiling late beats compiling early</h2>
      <p>
        A JIT knows things an ahead-of-time compiler can't:
      </p>
      <ul>
        <li>
          <strong>Which CPU it's on</strong> — it can emit instructions for the exact processor, not a lowest common
          denominator.
        </li>
        <li>
          <strong>Which branches actually run</strong> — a check that has never once been true can be compiled away,
          with a guard that de-optimises if it ever becomes true.
        </li>
        <li>
          <strong>Which type really arrives</strong> — an interface call whose receiver has always been{" "}
          <code>ArrayList</code> can be inlined as if it were a direct call.
        </li>
        <li>
          <strong>What's worth inlining</strong> — small hot methods get pasted into their callers, which then
          exposes further optimisations.
        </li>
      </ul>
      <CodeBlock language="bash" filename="watching the JIT work" code={jitFlags} />

      <Callout variant="warning" title="This is why microbenchmarks lie">
        Time a loop the first time it runs and you're timing the interpreter. Run it ten thousand times and you're
        timing optimised native code — often ten to a hundred times faster. Any benchmark that doesn't warm up first
        is measuring the wrong thing, which is exactly why the JMH tool exists.
      </Callout>

      <h2>The cost: startup time</h2>
      <p>
        Loading, verifying and interpreting before the JIT kicks in means a Java process is slow for its first
        moments. For a server running for weeks, irrelevant. For a short-lived command-line tool or a serverless
        function, it's the dominant cost — which is what GraalVM's <code>native-image</code> addresses, compiling
        ahead of time to a native binary that starts in milliseconds but gives up the JIT's runtime knowledge.
      </p>

      <DifficultyLevels
        simple={
          <p>
            Your code gets translated twice. First, before you run it, into a simple universal instruction set.
            Then, while it runs, the parts that get used a lot are translated again into instructions for your
            actual processor. That's why Java programs start a little slowly but get fast once they've been running
            for a while.
          </p>
        }
        developer={
          <p>
            <code>javac</code> emits bytecode with minimal optimisation. HotSpot loads, verifies, and initialises
            classes lazily, then interprets while gathering profile data. Tiered compilation promotes hot methods
            through C1 (fast to compile, lightly optimised) to C2 (slow to compile, aggressively optimised, with
            inlining, escape analysis and speculative devirtualisation). Speculations are guarded, and a failed
            guard triggers deoptimisation back to the interpreter.
          </p>
        }
        interview={
          <p>
            The answer that separates candidates: explain <em>why</em> a JIT can beat an ahead-of-time compiler
            despite doing its work under time pressure — profile-guided speculation. It can devirtualise a
            megamorphic-looking call because in this run it's monomorphic, inline across that call, and fall back
            safely via deoptimisation if the assumption breaks. Then name the trade-off: warm-up cost and memory
            overhead, which is why AOT (GraalVM native-image, CRaC) exists for short-lived processes.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="A method runs 5 million times in a tight loop and gets dramatically faster after the first second. What happened?"
        options={[
          { id: "a", text: "The garbage collector freed memory, so there was less to scan" },
          { id: "b", text: "The JIT compiled the hot method to optimised native code" },
          { id: "c", text: "The class loader finished loading classes" },
          { id: "d", text: "The operating system cached the .class file" },
        ]}
        correctId="b"
        explanation="Crossing the invocation threshold triggers JIT compilation. The interpreted version is replaced by native code that can inline callees and specialise on the types actually observed — routinely an order of magnitude faster."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Read your own bytecode"
        hint={
          <p>
            <code>javap -c ClassName</code> prints the instructions. Try it on a method with a{" "}
            <code>for</code> loop and one with string concatenation — the second will surprise you.
          </p>
        }
      >
        Compile a small class containing a loop that concatenates strings with <code>+</code>, then run{" "}
        <code>javap -c</code> on it. Find where <code>StringBuilder</code> appears even though you never wrote it,
        and note whether it's created inside or outside the loop. That single observation is the whole argument
        behind a lesson later in this course.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the JIT compiler, and why does Java need both an interpreter and a JIT?"
        answer={
          <p>
            The JIT (just-in-time) compiler translates bytecode into native machine code while the program runs.
            Java uses both because they fail in opposite directions: the interpreter starts instantly but executes
            slowly, while compilation produces fast code but costs time up front. HotSpot therefore interprets
            everything at first, profiles as it goes, and only compiles methods that prove they're worth it —
            typically via tiered compilation through C1 and then C2. Because compilation happens after profiling, the
            JIT can inline across virtual calls and speculate on observed types, guarded by checks that deoptimise
            back to the interpreter if an assumption is violated.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Two compilers: javac (source to bytecode, ahead of time) and the JIT (bytecode to native, at runtime).",
          "Bytecode is stack-based and simple, which is what makes the JVM portable.",
          "The JVM loads, verifies, links and initialises each class lazily — on first use, not at startup.",
          "Execution starts interpreted; hot methods are profiled and then JIT-compiled with speculation and inlining.",
          "The price is warm-up: benchmarks without a warm-up phase measure the interpreter, not your code.",
        ]}
      />
    </>
  )
}
