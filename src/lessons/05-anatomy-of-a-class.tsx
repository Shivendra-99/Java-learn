import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CodeWalkthrough } from "@/components/lesson/code-walkthrough"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"
import { Boxes, FileText, FolderTree, Hammer, Play, SquareFunction, Type } from "lucide-react"

const account = `package com.example.banking;

import java.util.List;
import java.util.ArrayList;

/**
 * A single customer account. Balance is held in whole pence
 * to avoid floating-point rounding errors.
 */
public class Account {

    private final String id;
    private long balancePence;
    private final List<String> history = new ArrayList<>();

    public Account(String id, long openingPence) {
        this.id = id;
        this.balancePence = openingPence;
    }

    public void deposit(long pence) {
        balancePence += pence;
        history.add("deposit " + pence);
    }

    public long balance() {
        return balancePence;
    }
}`

const layout = `src/
└── main/
    └── java/
        └── com/
            └── example/
                └── banking/
                    ├── Account.java      package com.example.banking;
                    ├── Bank.java         package com.example.banking;
                    └── report/
                        └── Statement.java  package com.example.banking.report;`

export default function AnatomyOfAClassLesson() {
  return (
    <>
      <p>
        Hello World is one class with one method. Real files have more parts, always in the same order, and each
        part has rules about where it can appear. Learn the shape once and every Java file you open afterwards is
        immediately navigable.
      </p>

      <CodeBlock language="java" filename="Account.java" code={account} />

      <h2>Part by part</h2>
      <CodeWalkthrough
        title="Account.java, top to bottom"
        filename="Account.java"
        language="java"
        code={account}
        steps={[
          {
            id: "package",
            label: "package declaration",
            detail:
              "Must be the first statement in the file, and there can be only one. It gives the class its full name: com.example.banking.Account. The folder path on disk has to match this exactly.",
            lines: 1,
            icon: FolderTree,
          },
          {
            id: "imports",
            label: "imports",
            detail:
              "Shorthand, not inclusion. 'import java.util.List' lets you write List instead of java.util.List; it does not copy any code or cost anything at runtime. Everything in java.lang is imported automatically.",
            range: [3, 4],
            icon: FileText,
          },
          {
            id: "javadoc",
            label: "the Javadoc comment",
            detail:
              "A /** ... */ comment attached to a declaration. Tooling extracts it into documentation and your IDE shows it on hover, so this is where the 'why' goes — here, why the balance is a long rather than a double.",
            range: [6, 9],
            icon: FileText,
          },
          {
            id: "class",
            label: "the class declaration",
            detail:
              "public means any package can use it. Because it is public, the file must be Account.java. A file may hold several classes but at most one public one.",
            lines: 10,
            icon: Boxes,
          },
          {
            id: "fields",
            label: "fields (instance state)",
            detail:
              "Each Account object gets its own copy of these. private keeps them unreachable from outside the class; final means the reference is assigned once and never reassigned.",
            range: [12, 14],
            icon: Type,
          },
          {
            id: "constructor",
            label: "the constructor",
            detail:
              "Same name as the class, no return type — that is what makes it a constructor rather than a method. Its job is to leave the new object in a valid state. 'this.id' distinguishes the field from the parameter of the same name.",
            range: [16, 19],
            icon: Hammer,
          },
          {
            id: "method",
            label: "a method that changes state",
            detail:
              "void means it returns nothing; it exists for its effect on the object. Note it can reach balancePence and history directly — inside the class, private is no obstacle.",
            range: [21, 24],
            icon: Play,
          },
          {
            id: "accessor",
            label: "a method that reports state",
            detail:
              "Returns the balance without exposing the field itself. Callers get the value; they cannot assign to it. That is the practical meaning of encapsulation.",
            range: [26, 28],
            icon: SquareFunction,
          },
        ]}
      />

      <h2>The order is fixed</h2>
      <ol>
        <li>
          <code>package</code> — at most one, and it must come first.
        </li>
        <li>
          <code>import</code> statements — any number, all before the first type declaration.
        </li>
        <li>Type declarations — classes, interfaces, enums, records.</li>
      </ol>
      <p>
        Inside a class the order is conventional rather than enforced, but almost everyone writes: static fields,
        instance fields, constructors, then methods. Following that convention means readers can find things
        without searching.
      </p>

      <h2>Packages are folders</h2>
      <p>
        The package declaration and the directory structure must agree. This is not a style rule — the compiler and
        the class loader both rely on it to turn a class name into a file path.
      </p>
      <CodeBlock language="text" filename="project layout" code={layout} />
      <p>
        Package names are lowercase and conventionally start with a domain you control, reversed:{" "}
        <code>com.example.banking</code>. That convention exists to keep your <code>Account</code> from colliding
        with someone else's <code>Account</code> when both end up on the same classpath.
      </p>

      <AnalogyCard title="A file is a form; the parts have to go in the boxes provided.">
        Package is the address at the top. Imports are the "see also" references. The class is the form itself,
        fields are the blanks it contains, the constructor is the rule for filling in a fresh copy, and methods are
        the things you're allowed to do with a completed one. Write the address halfway down the page and the
        clerk — here, the compiler — rejects it.
      </AnalogyCard>

      <Callout variant="info" title="java.lang needs no import">
        <code>String</code>, <code>System</code>, <code>Integer</code>, <code>Object</code>, <code>Math</code>,{" "}
        <code>Thread</code> and the exception hierarchy all live in <code>java.lang</code>, which is imported into
        every file automatically. That's why Hello World has no imports at all.
      </Callout>

      <CommonMistake
        title="using a wildcard import and then colliding"
        wrong={`import java.util.*;
import java.awt.*;

// error: reference to List is ambiguous
//   both java.util.List and java.awt.List match
List<String> names = new ArrayList<>();`}
        right={`import java.util.List;
import java.util.ArrayList;
import java.awt.Rectangle;

List<String> names = new ArrayList<>();`}
        explanation={
          <p>
            A wildcard import brings in every public type of a package, so two wildcards can supply the same simple
            name and the compiler refuses to guess. Explicit imports also document exactly which types a file
            depends on — which is why every IDE generates them by default, and why you rarely see{" "}
            <code>.*</code> in professional code.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Every Java file follows the same shape: where it lives (package), what it borrows (imports), and then
            the class itself — first the things it remembers (fields), then how to create one (constructor), then
            what it can do (methods).
          </p>
        }
        developer={
          <p>
            The compilation unit is: optional package declaration, then imports, then type declarations. At most one
            top-level type may be public, and it must match the file name. Package structure maps to directory
            structure because the class loader resolves a binary name to a resource path. Imports are compile-time
            only — the constant pool stores fully qualified names regardless.
          </p>
        }
        interview={
          <p>
            Two details worth knowing: a single <code>.java</code> file may declare several top-level classes as
            long as at most one is public (each still produces its own <code>.class</code> file), and{" "}
            <code>import</code> costs nothing at runtime — it is not <code>#include</code>. If asked about wildcard
            imports, the answer is that they compile identically but risk ambiguity and hide dependencies, so
            explicit imports are standard.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Which statement about a .java file is true?"
        options={[
          { id: "a", text: "It may contain only one class" },
          { id: "b", text: "It may contain several top-level classes, but at most one public one" },
          { id: "c", text: "Imports copy the imported class into your file, increasing its size" },
          { id: "d", text: "The package declaration may appear anywhere before the class" },
        ]}
        correctId="b"
        explanation="Several top-level classes are allowed and each compiles to its own .class file, but only one may be public and it must match the file name. Imports are purely a naming shorthand, and the package declaration must be the first statement."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Compile a packaged class by hand"
        hint={
          <p>
            From the directory above <code>com/</code>, run <code>javac com/example/banking/Account.java</code> and
            then <code>java com.example.banking.Bank</code> — note the dots, not slashes, when running.
          </p>
        }
      >
        Create the folder structure <code>com/example/banking/</code>, put a packaged class in it with a{" "}
        <code>main</code> method, and compile and run it from the parent directory. Then deliberately mismatch the
        package declaration and the folder name to see the error the class loader produces — you'll meet it again
        in a real project.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Can a single Java file contain more than one class?"
        answer={
          <p>
            Yes. A compilation unit may declare any number of top-level types, but at most one may be{" "}
            <code>public</code>, and if there is a public one the file must be named after it. Each type still
            compiles to its own <code>.class</code> file, so a file with three classes produces three class files.
            In practice, extra top-level classes are rare — package-private helpers that are only used by the main
            class are the usual case, and nested classes are normally the better choice.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Order is fixed: package (first, at most one), then imports, then type declarations.",
          "Package structure must mirror the directory structure — the class loader depends on it.",
          "Imports are a naming shorthand with zero runtime cost; java.lang is imported automatically.",
          "A file can declare several classes but only one public class, which must match the file name.",
          "Conventional order inside a class: static fields, instance fields, constructors, methods.",
        ]}
      />
    </>
  )
}
