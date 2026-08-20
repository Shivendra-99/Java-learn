import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"

const cBuild = `# C, 1995: one build per platform, and the code often differs too
gcc -o report-linux   report.c   # only runs on Linux
gcc -o report-mac     report.c   # only runs on macOS
gcc -o report-win.exe report.c   # only runs on Windows

# ship three binaries, test three binaries, fix three sets of bugs`

const javaBuild = `# Java: one build, everywhere
javac Report.java     # produces Report.class - bytecode, not machine code

java Report           # runs on Linux
java Report           # ...and on macOS
java Report           # ...and on Windows, from the same .class file`

const memory = `// C: you allocate, you free, and if you forget, the program leaks
char *buffer = malloc(1024);
// ... 200 lines later, on one of four code paths ...
free(buffer);          // forget this and you leak; do it twice and you crash

// Java: you allocate, the garbage collector frees
String buffer = new String(data);
// ... nothing to free. When nothing can reach it, it goes away.`

export default function WhyJavaLesson() {
  return (
    <>
      <p>
        Java is thirty years old, which in software usually means "interesting historically". It isn't: Java still
        runs the payments that clear your card, the Android app in your pocket, and the data pipelines behind most
        large companies. That staying power comes from two decisions made in 1995, and both are easier to appreciate
        if you first see the problem they solved.
      </p>

      <h2>Problem one: every computer was a different computer</h2>
      <p>
        A compiled C or C++ program is machine code for one processor family and one operating system. Shipping to
        three platforms meant three builds, three sets of quirks, and three sets of bugs — and that's before the
        parts of the code that genuinely had to differ.
      </p>
      <CodeBlock language="bash" filename="the old way" code={cBuild} />
      <p>
        Java's answer was to stop compiling to machine code. <code>javac</code> compiles your source to{" "}
        <strong>bytecode</strong>: instructions for a machine that doesn't physically exist. Every platform then gets
        one program written specially for it — the <strong>Java Virtual Machine</strong> — whose job is to run that
        bytecode. Port the JVM once, and every Java program ever written runs on the new platform.
      </p>
      <CodeBlock language="bash" filename="the Java way" code={javaBuild} />

      <AnalogyCard title="Bytecode is a PDF; the JVM is the PDF reader.">
        You don't send someone a document formatted for their exact printer. You send a PDF, and whatever machine
        they have opens it and works out the local details. The PDF is the same everywhere; the reader is different
        everywhere. Java's <code>.class</code> file is the PDF, and the JVM is the reader — which is why "write once,
        run anywhere" was the slogan and not just marketing.
      </AnalogyCard>

      <h2>Problem two: memory management was eating everyone's time</h2>
      <p>
        In C you ask the operating system for memory and you are responsible for handing it back. Forget, and the
        program slowly bloats until it dies. Hand the same block back twice, or use it after freeing it, and you get
        a crash — or, worse, a security hole. Whole categories of famous vulnerabilities are exactly this mistake.
      </p>
      <CodeBlock language="java" filename="who cleans up?" code={memory} />
      <p>
        Java made memory the runtime's problem. You create objects; the <strong>garbage collector</strong> works out
        which ones nothing can reach any more and reclaims them. You trade a little performance and control for never
        writing a use-after-free bug again — a trade most business software is very happy to make.
      </p>

      <h2>What you get in the box</h2>
      <ul>
        <li>
          <strong>Static typing</strong> — the compiler knows the type of everything and rejects code that can't
          work, so a whole class of mistakes never reaches production.
        </li>
        <li>
          <strong>A vast standard library</strong> — collections, dates, files, networking, cryptography and
          concurrency are all shipped, not sourced from a package registry.
        </li>
        <li>
          <strong>Backwards compatibility</strong> — code written in 2005 still compiles and runs. Java takes this
          more seriously than almost any other ecosystem.
        </li>
        <li>
          <strong>Genuinely fast</strong> — the JVM watches which methods run often and compiles those to native code
          while the program runs. Long-running Java services routinely land within a small factor of C++.
        </li>
      </ul>

      <Callout variant="info" title="Which version should you learn?">
        Java releases every six months, but only some releases are <strong>LTS</strong> (long-term support): 8, 11,
        17, 21, 25. Most companies run an LTS. Everything in this course works on Java 17 and later, and where a
        feature is newer than that, the lesson says so.
      </Callout>

      <h2>Where Java actually shows up</h2>
      <ul>
        <li>
          <strong>Backend services</strong> — banking, insurance, retail, logistics. If a company has been writing
          software for more than a decade, it very likely has Java in it.
        </li>
        <li>
          <strong>Android</strong> — the platform APIs are Java, even as Kotlin has become the preferred language.
        </li>
        <li>
          <strong>Data infrastructure</strong> — Kafka, Spark, Hadoop, Elasticsearch and Cassandra all run on the
          JVM.
        </li>
        <li>
          <strong>Tools you already use</strong> — IntelliJ IDEA, Jenkins, and Minecraft's Java Edition.
        </li>
      </ul>
      <p>
        It's less used for quick scripts, tiny command-line tools where startup time dominates, and front-end web
        work. Knowing what a language <em>isn't</em> for is part of knowing the language.
      </p>

      <DifficultyLevels
        simple={
          <p>
            Programs normally have to be rebuilt for each kind of computer. Java gets around it by translating your
            code into instructions for a pretend computer, and then giving every real computer a small program that
            can act like that pretend one. Java also cleans up unused memory for you, which removes a whole family of
            bugs.
          </p>
        }
        developer={
          <p>
            <code>javac</code> emits platform-independent bytecode targeting the JVM specification. The JVM
            interprets it and, via the JIT compiler, promotes hot paths to optimised native code — so the same
            artifact is portable <em>and</em> fast once warmed up. Automatic memory management, a strong static type
            system, and an unusually stable standard library are the other three reasons large codebases stay
            maintainable over decades.
          </p>
        }
        interview={
          <p>
            The precise phrasing: Java is compiled <em>and</em> interpreted. Source compiles ahead of time to
            bytecode; bytecode is interpreted at runtime and JIT-compiled when profiling shows it's worth it.
            "Platform independent" describes the bytecode, not the JVM — the JVM itself is very much platform
            specific, and that's the point. Expect a follow-up on why this makes startup slower than a native binary
            and what projects like GraalVM native-image do about it.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="What exactly is 'platform independent' about Java?"
        options={[
          { id: "a", text: "The JVM — the same JVM binary runs on every operating system" },
          { id: "b", text: "The bytecode — the same .class file runs on any platform that has a JVM" },
          { id: "c", text: "The source code, because .java files are plain text" },
          { id: "d", text: "Nothing — Java is compiled per platform like C" },
        ]}
        correctId="b"
        explanation="The compiled bytecode is the portable artifact. The JVM is the opposite of portable: you download a different build of it for Windows, macOS, and Linux, and that per-platform program is precisely what makes your bytecode run everywhere."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Find the Java you already run"
        hint={
          <p>
            Try <code>java -version</code> in a terminal. If it prints something, you already have a JVM. Also look
            at the tools you use daily — anything shipping a <code>.jar</code> file is Java.
          </p>
        }
      >
        Before writing any code, work out whether Java is already on your machine and which version it is. Then pick
        one piece of software you use that runs on the JVM and find out why its authors chose it — the answer is
        usually portability, the library ecosystem, or raw throughput.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Is Java a compiled or an interpreted language?"
        answer={
          <p>
            Both, in sequence. <code>javac</code> compiles source to bytecode ahead of time — that's a real
            compilation step with full type checking. At runtime the JVM interprets that bytecode, and its JIT
            compiler translates frequently executed methods into native machine code, applying optimisations that an
            ahead-of-time compiler can't because they depend on how the program actually behaves. So Java gets
            compile-time safety and runtime-informed optimisation, at the cost of slower startup than a native
            binary.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Java compiles to bytecode, not machine code — one artifact runs on any platform with a JVM.",
          "The JVM is platform-specific; the bytecode it runs is not. That split is the whole idea.",
          "Automatic garbage collection removes use-after-free and double-free bugs entirely.",
          "Static typing, a huge standard library, and serious backwards compatibility are why big codebases stay in Java.",
          "Learn an LTS release: 17 or 21. Everything here targets Java 17 and later.",
        ]}
      />
    </>
  )
}
