import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CodeWalkthrough } from "@/components/lesson/code-walkthrough"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"
import { TerminalDemo } from "@/components/lesson/terminal-demo"
import { Boxes, Braces, Eye, KeyRound, Play, Terminal, Type } from "lucide-react"

const hello = `public class Hello {

    public static void main(String[] args) {
        String name = "world";
        System.out.println("Hello, " + name + "!");
    }
}`

const withArgs = `public class Greet {
    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("Usage: java Greet <name>");
            return;
        }
        System.out.println("Hello, " + args[0] + "!");
    }
}

// $ java Greet.java Priya
// Hello, Priya!`

export default function FirstJavaProgramLesson() {
  return (
    <>
      <p>
        Every language starts with Hello World, and in Java it is famously wordy — five lines to print one. That
        wordiness is not decoration: each keyword is doing a specific job, and once you know what each one means,
        the rest of the language stops looking arbitrary. We'll write it, run it, and then take it apart word by
        word.
      </p>

      <h2>Get a JDK</h2>
      <p>
        Any OpenJDK build works. The quickest routes: download{" "}
        <strong>Eclipse Temurin 21</strong> from adoptium.net, or use a package manager —{" "}
        <code>winget install EclipseAdoptium.Temurin.21.JDK</code> on Windows,{" "}
        <code>brew install openjdk@21</code> on macOS, <code>sudo apt install openjdk-21-jdk</code> on Debian or
        Ubuntu. Verify with <code>javac -version</code>, not just <code>java -version</code>.
      </p>

      <h2>Write it</h2>
      <p>
        Create a file called <code>Hello.java</code>. The name matters — Java requires the file name to match the
        public class inside it, exactly, including capitalisation.
      </p>
      <CodeBlock language="java" filename="Hello.java" code={hello} />

      <h2>Every word, explained</h2>
      <CodeWalkthrough
        title="Hello.java, taken apart"
        filename="Hello.java"
        language="java"
        code={hello}
        steps={[
          {
            id: "public-class",
            label: "public class Hello",
            detail:
              "A class is the smallest thing Java lets you define — all code lives inside one. 'public' means any other class may use it. Because it is public, this file must be named Hello.java.",
            lines: 1,
            icon: Boxes,
          },
          {
            id: "public",
            label: "public (on main)",
            detail:
              "The JVM has to be able to call main from outside your class, so it must be public. Make it private and the program compiles but refuses to start.",
            lines: 3,
            icon: KeyRound,
          },
          {
            id: "static",
            label: "static",
            detail:
              "static means the method belongs to the class, not to an instance. That is essential here: when the JVM starts there are no objects yet, so there is nothing to call a non-static method on.",
            lines: 3,
            icon: Play,
          },
          {
            id: "void",
            label: "void",
            detail:
              "The return type. void means 'returns nothing'. The exit code of a Java program comes from System.exit or from finishing normally — never from main's return value, unlike C.",
            lines: 3,
            icon: Type,
          },
          {
            id: "args",
            label: "String[] args",
            detail:
              "An array of the command-line arguments. Run 'java Hello a b' and args holds [\"a\", \"b\"]. The name args is convention, not a rule — the type and position are what matter.",
            lines: 3,
            icon: Terminal,
          },
          {
            id: "local",
            label: "String name = \"world\"",
            detail:
              "A local variable: a declared type, a name, and a value. Java is statically typed, so the compiler now knows name is a String and will reject anything that treats it otherwise.",
            lines: 4,
            icon: Type,
          },
          {
            id: "println",
            label: "System.out.println(...)",
            detail:
              "Read it right to left: println is a method on out, which is a static field on the class System. It writes a line to standard output. The + operator on a String concatenates.",
            lines: 5,
            icon: Eye,
          },
          {
            id: "braces",
            label: "The closing braces",
            detail:
              "Braces delimit blocks, and Java ignores your indentation entirely — it is for humans. The inner brace closes main; the outer one closes the class.",
            range: [6, 7],
            icon: Braces,
          },
        ]}
      />

      <h2>Compile it and run it</h2>
      <TerminalDemo
        title="From source to output"
        prompt="~/java-practice"
        steps={[
          {
            command: "javac Hello.java",
            output: [],
            note: "Silence means success. javac type-checks the whole file and writes bytecode; any mistake and you would get an error here instead, before anything runs.",
          },
          {
            command: "ls",
            output: ["Hello.class  Hello.java"],
            note: "Hello.class is the bytecode. It is what you would ship — the .java file is not needed to run.",
          },
          {
            command: "java Hello",
            output: ["Hello, world!"],
            note: "Note: 'java Hello', not 'java Hello.class'. You pass the class name, and the JVM finds the file on the classpath.",
          },
          {
            command: "java Hello.java",
            output: ["Hello, world!"],
            note: "Since Java 11 you can skip javac for a single file: the JVM compiles it in memory and runs it. Great for learning, not how real projects build.",
          },
        ]}
      />

      <Callout variant="tip" title="You can skip the file entirely">
        Type <code>jshell</code> and you get an interactive Java prompt where{" "}
        <code>System.out.println("hi")</code> works on its own — no class, no main. It's the fastest way to check
        what a method does, and this course's snippets mostly paste straight into it.
      </Callout>

      <h2>Reading command-line arguments</h2>
      <CodeBlock language="java" filename="Greet.java" code={withArgs} />
      <p>
        <code>args.length</code> is the count, <code>args[0]</code> is the first argument. Note what's{" "}
        <em>not</em> there: the program name. In C, <code>argv[0]</code> is the executable; in Java,{" "}
        <code>args[0]</code> is the first real argument.
      </p>

      <CommonMistake
        title="the file name not matching the public class"
        wrong={`// file: hello.java   (lowercase h)
public class Hello {
    public static void main(String[] args) { }
}

// $ javac hello.java
// error: class Hello is public, should be
//        declared in a file named Hello.java`}
        right={`// file: Hello.java
public class Hello {
    public static void main(String[] args) { }
}

// $ javac Hello.java   ->  compiles`}
        explanation={
          <p>
            A public class must live in a file with exactly its name. This bites hardest on Windows and macOS, whose
            file systems ignore case — the file <em>opens</em> fine, so the error message looks nonsensical until you
            notice the capital letter. The rule exists so the compiler can find a class from its name alone without
            scanning every file.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Java code has to sit inside a class, and a program starts at a special method called <code>main</code>.
            You save the code in a file named after the class, run <code>javac</code> to translate it, then{" "}
            <code>java</code> to run the translation. Everything on that <code>main</code> line is Java's way of
            saying "start here".
          </p>
        }
        developer={
          <p>
            The launcher looks for <code>public static void main(String[])</code> on the class you name. It must be
            public (callable from outside), static (no instance exists yet), return <code>void</code>, and take a{" "}
            <code>String[]</code>. <code>String... args</code> is also accepted, since varargs compile to an array.
            Everything else about the signature is fixed — a wrong one compiles fine and then fails at launch with{" "}
            <code>NoSuchMethodError: main</code>.
          </p>
        }
        interview={
          <p>
            Be ready to justify each modifier: <strong>public</strong> so the launcher can call it,{" "}
            <strong>static</strong> because the JVM has no instance to call it on and creating one would require
            choosing a constructor, <strong>void</strong> because the exit status comes from{" "}
            <code>System.exit</code>, and <strong>String[]</strong> for arguments. A good follow-up answer: yes, a
            class can have several <code>main</code> methods via overloading, but only the{" "}
            <code>String[]</code> one is an entry point — the rest are ordinary methods.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why must main be static?"
        options={[
          { id: "a", text: "So it runs faster — static methods skip virtual dispatch" },
          { id: "b", text: "So the JVM can call it without first constructing an instance of the class" },
          { id: "c", text: "Because it returns void" },
          { id: "d", text: "So it can be called from other classes" },
        ]}
        correctId="b"
        explanation="At startup no objects exist. A non-static main would need an instance, which would mean the JVM choosing and calling a constructor — an arbitrary decision the language avoids by requiring static. (Point d is what public gives you, not static.)"
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Break it on purpose"
        hint={
          <p>
            Try each change on its own and read the error carefully — note which ones fail at{" "}
            <code>javac</code> time and which only fail when you run <code>java</code>.
          </p>
        }
      >
        Starting from a working <code>Hello.java</code>, make these four changes one at a time and record the exact
        error: rename the file to <code>hello.java</code>; remove <code>static</code> from main; change{" "}
        <code>String[] args</code> to <code>int[] args</code>; and rename <code>main</code> to <code>start</code>.
        Two of these are compile errors and two are runtime errors — knowing which is which tells you what the
        compiler can and can't check.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What happens if you compile a class whose main method has the wrong signature?"
        answer={
          <p>
            It compiles without complaint — <code>public void main(String[] args)</code> or{" "}
            <code>public static void main(int[] args)</code> are perfectly legal methods, just not entry points. The
            failure comes at launch: the JVM looks specifically for{" "}
            <code>public static void main(String[])</code> and, not finding it, exits with{" "}
            <code>NoSuchMethodError: main</code> or "Main method not found in class X". It's a useful example of the
            difference between what the compiler checks (is this valid Java?) and what the runtime checks (does this
            program have the shape the launcher needs?).
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "A public class must live in a file with exactly the same name, capitalisation included.",
          "javac turns Hello.java into Hello.class; java runs the class by name, not by file.",
          "public static void main(String[] args) — public so the launcher can call it, static because no instance exists yet, void because exit codes come from System.exit.",
          "args holds only real arguments; unlike C there is no program name at index 0.",
          "Since Java 11, 'java Hello.java' compiles and runs in one step — handy for learning, not for projects.",
        ]}
      />
    </>
  )
}
