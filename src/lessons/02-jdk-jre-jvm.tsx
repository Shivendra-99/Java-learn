import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"
import { TerminalDemo } from "@/components/lesson/terminal-demo"

const layers = `JDK  — Java Development Kit
 ├── javac        the compiler        (source  -> bytecode)
 ├── jar          the packager        (classes -> one .jar file)
 ├── javadoc      the doc generator
 ├── jshell       an interactive Java prompt
 ├── jdb          the debugger
 └── JRE — Java Runtime Environment
      ├── the class library (java.lang, java.util, java.io, ...)
      └── JVM — Java Virtual Machine
           ├── class loader     finds and loads .class files
           ├── bytecode verifier rejects unsafe bytecode
           ├── interpreter + JIT executes, then optimises
           └── garbage collector reclaims unreachable objects`

export default function JdkJreJvmLesson() {
  return (
    <>
      <p>
        Three acronyms, one Russian doll. They confuse people because all three get installed by a single download,
        so it's never obvious where one stops and the next begins. The short version:{" "}
        <strong>the JVM runs your program, the JRE is the JVM plus the standard library, and the JDK is the JRE plus
        the tools you need to produce a program in the first place.</strong>
      </p>

      <CodeBlock language="text" filename="what contains what" code={layers} />

      <h2>JVM — the engine</h2>
      <p>
        The Java Virtual Machine is a program that reads bytecode and executes it. It's a specification first and an
        implementation second, which is why there are several: HotSpot (the one you almost certainly have), OpenJ9,
        GraalVM. Its responsibilities:
      </p>
      <ul>
        <li>
          <strong>Load</strong> classes, on demand, the first time each one is used.
        </li>
        <li>
          <strong>Verify</strong> the bytecode — reject anything that would corrupt memory or break the type system.
          This is why a broken <code>.class</code> file fails safely instead of crashing your machine.
        </li>
        <li>
          <strong>Execute</strong>, interpreting at first and JIT-compiling the hot paths to native code.
        </li>
        <li>
          <strong>Manage memory</strong> — allocate objects on the heap and garbage-collect them when unreachable.
        </li>
      </ul>

      <h2>JRE — the engine plus the parts</h2>
      <p>
        The JVM alone can't do much: <code>String</code>, <code>ArrayList</code>, <code>System.out</code> and
        everything else you import has to come from somewhere. That's the class library, and JVM + class library is
        the JRE. It's what a machine needs to <em>run</em> Java, not to write it.
      </p>
      <Callout variant="info" title="The JRE isn't a separate download any more">
        Up to Java 8, Oracle shipped a standalone JRE for end users. From Java 11 that stopped: you download a JDK,
        and if you want a runtime-only bundle you build one with <code>jlink</code>, which strips out the modules
        your application never touches. You'll still hear "install the JRE" — treat it as "install a Java runtime".
      </Callout>

      <h2>JDK — everything needed to build</h2>
      <p>
        The JDK adds the development tools. <code>javac</code> is the one you'll use constantly, but the others earn
        their place: <code>jshell</code> for trying an idea without creating a file, <code>jar</code> for packaging,{" "}
        <code>javap</code> for looking at the bytecode your source became.
      </p>

      <AnalogyCard title="A car factory, a car, and an engine.">
        The JVM is the engine — it converts fuel into motion and knows nothing about anything else. The JRE is the
        finished car: engine plus the wheels, seats, and wiring you need to actually drive somewhere. The JDK is the
        factory: it contains a complete car, and also the machinery to build new ones. You need the factory to make
        cars; your users only need the car.
      </AnalogyCard>

      <h2>Look inside your own installation</h2>
      <TerminalDemo
        title="Explore the JDK you have"
        prompt="~"
        steps={[
          {
            command: "java -version",
            output: [
              'openjdk version "21.0.3" 2024-04-16 LTS',
              "OpenJDK Runtime Environment Temurin-21.0.3+9 (build 21.0.3+9-LTS)",
              "OpenJDK 64-Bit Server VM Temurin-21.0.3+9 (build 21.0.3+9-LTS, mixed mode)",
            ],
            note: "Three lines, three layers: the version, the runtime environment, and the VM itself. 'mixed mode' means it both interprets and JIT-compiles.",
          },
          {
            command: "javac -version",
            output: ["javac 21.0.3"],
            note: "If this errors but java works, you have a runtime but no compiler — that is exactly the JRE-vs-JDK distinction biting.",
          },
          {
            command: "ls $JAVA_HOME/bin",
            output: [
              "java     javac    javadoc  javap    jar",
              "jarsigner jcmd    jconsole jdb      jdeps",
              "jlink    jmap     jpackage jshell   jstack",
            ],
            note: "Everything past java itself is JDK territory — compiling, packaging, inspecting, debugging, profiling.",
          },
          {
            command: "jshell",
            output: [
              "|  Welcome to JShell -- Version 21.0.3",
              "|  For an introduction type: /help intro",
              "",
              "jshell> 2 + 2",
              "$1 ==> 4",
            ],
            note: "JShell evaluates Java without a class or a main method. It is the fastest way to check what a method actually returns.",
          },
        ]}
      />

      <h2>The one that actually matters day to day</h2>
      <p>
        You install a JDK. Which one? Any build of OpenJDK — Eclipse Temurin, Amazon Corretto, Azul Zulu, Microsoft
        Build of OpenJDK, or Oracle's. They come from the same source and behave identically for everything in this
        course; they differ in support terms and licensing, not language features.
      </p>

      <CommonMistake
        title="assuming a machine that runs Java can compile Java"
        wrong={`$ java -version
openjdk version "21.0.3"     # fine

$ javac Main.java
javac: command not found     # no compiler here`}
        right={`# Install a full JDK, then point tools at it
$ java -version && javac -version
openjdk version "21.0.3"
javac 21.0.3

$ echo $JAVA_HOME
/usr/lib/jvm/temurin-21`}
        explanation={
          <p>
            Servers and CI images frequently ship a runtime only, because running is all they need to do. The moment
            a build step tries to compile, it fails with a message that looks like Java isn't installed at all. The
            fix is a JDK, and usually a <code>JAVA_HOME</code> pointing at it — many build tools read that variable
            rather than searching your <code>PATH</code>.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            The JVM is the thing that runs Java programs. The JRE is that plus all the ready-made building blocks
            programs expect. The JDK is that plus the tools for writing your own. If you're learning to write Java,
            you want the JDK — and it includes the other two.
          </p>
        }
        developer={
          <p>
            The JVM is a specification with multiple implementations (HotSpot, OpenJ9, GraalVM), responsible for
            class loading, bytecode verification, execution, and memory management. The JRE bundles it with{" "}
            <code>java.base</code> and the rest of the class library. The JDK adds <code>javac</code>,{" "}
            <code>jar</code>, <code>javap</code>, <code>jlink</code>, <code>jshell</code> and the diagnostic tools.
            Since Java 9, all of this is modular, and <code>jlink</code> lets you produce a trimmed runtime image
            containing only the modules your app resolves.
          </p>
        }
        interview={
          <p>
            Say it as containment — JDK ⊃ JRE ⊃ JVM — then add the detail that shows depth: the JVM is a spec, not a
            product, so "the JVM" in a given deployment means a specific implementation with its own GC and JIT
            characteristics. Mentioning that the standalone JRE was dropped after Java 8 in favour of{" "}
            <code>jlink</code>-built runtime images signals that your knowledge isn't ten years stale.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="A colleague's deployment box runs your app fine, but the build step there fails with 'javac: command not found'. What is installed?"
        options={[
          { id: "a", text: "A JDK, but the PATH is wrong" },
          { id: "b", text: "A runtime only (JRE) — no compiler" },
          { id: "c", text: "Nothing; java would have failed too" },
          { id: "d", text: "The wrong JVM implementation" },
        ]}
        correctId="b"
        explanation="java works, so a runtime is present. javac ships with the JDK, not the runtime — so this box has a JRE-style install. (A broken PATH is worth ruling out, but the classic cause is a runtime-only image.)"
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Prove the layers exist on your own machine"
        hint={
          <p>
            <code>java -XshowSettings:properties -version</code> prints dozens of properties, including{" "}
            <code>java.home</code>, <code>java.vm.name</code>, and <code>java.class.path</code>.
          </p>
        }
      >
        Run <code>java -XshowSettings:properties -version</code> and find three things: where your JDK lives, which
        VM implementation you're running, and which version of the class library it loads. Then open{" "}
        <code>jshell</code> and evaluate <code>System.getProperty("java.vendor")</code> to see who built it.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the difference between JDK, JRE and JVM?"
        answer={
          <p>
            They nest. The <strong>JVM</strong> executes bytecode: it loads classes, verifies them, interprets and
            JIT-compiles, and manages the heap. The <strong>JRE</strong> is the JVM plus the standard class library —
            the minimum to run a Java application. The <strong>JDK</strong> is the JRE plus development tools:{" "}
            <code>javac</code>, <code>jar</code>, <code>javadoc</code>, <code>jshell</code>, and the debugging and
            profiling utilities. Developers install a JDK; production only needs a runtime, which since Java 11 is
            typically produced with <code>jlink</code> rather than downloaded as a separate JRE.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "JDK ⊃ JRE ⊃ JVM — each one contains the one after it.",
          "The JVM loads, verifies, executes, and garbage-collects. It is a specification with several implementations.",
          "The JRE is the JVM plus the standard class library: enough to run, not enough to compile.",
          "The JDK adds javac, jar, javap, jshell and the diagnostics — install this one.",
          "'javac: command not found' on a machine where java works means a runtime-only install.",
        ]}
      />
    </>
  )
}
