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

const naming = `package com.example.billing;          // reverse domain, all lowercase

// The class's fully qualified name is now:
//   com.example.billing.Invoice
//
// Two libraries can both define an "Invoice" without colliding,
// because their packages differ.

// Conventions:
//   all lowercase, no underscores       com.example.orderservice
//   singular or plural, be consistent   ...billing, ...util
//   avoid java.* and javax.*            reserved, and the JVM rejects some`

const byFeature = `Layered — everything of one KIND together:
  com.example
    controller/   OrderController, CustomerController, InvoiceController
    service/      OrderService, CustomerService, InvoiceService
    repository/   OrderRepository, CustomerRepository, InvoiceRepository

  Changing one feature touches three packages. Nothing can be package-private,
  because every layer needs the one below it to be public.

By feature — everything about one THING together:
  com.example
    order/        OrderController, OrderService, OrderRepository, Order
    customer/     CustomerController, CustomerService, Customer
    billing/      InvoiceController, InvoiceService, Invoice

  Changing a feature touches one package. Internals can stay package-private,
  so the package has a real, enforced public surface.`

const classpath = `# The classpath tells the JVM where to look for classes
java -cp out com.example.Main
java -cp "out:lib/gson.jar:lib/slf4j.jar" com.example.Main    # Linux/macOS
java -cp "out;lib\\gson.jar;lib\\slf4j.jar" com.example.Main    # Windows uses ;

# A jar is a zip of .class files plus a manifest
jar --create --file app.jar --main-class com.example.Main -C out .
java -jar app.jar

# What is actually on the classpath at runtime:
java -XshowSettings:properties -version 2>&1 | grep class.path`

const modules = `// module-info.java, at the source root (Java 9+)
module com.example.billing {
    requires com.example.core;       // what this module needs
    requires java.sql;

    exports com.example.billing.api; // what other modules may use
    // com.example.billing.internal is NOT exported: inaccessible outside,
    // even though its classes are public.
}`

const staticImport = `import static java.lang.Math.max;
import static java.lang.Math.PI;
import static org.junit.jupiter.api.Assertions.*;   // conventional in tests

double area = PI * r * r;      // instead of Math.PI
int biggest = max(a, b);       // instead of Math.max

// Use sparingly outside tests: a bare max(a, b) gives the reader
// no clue where it came from.`

export default function PackagesAndAccessLesson() {
  return (
    <>
      <p>
        Packages do two jobs. The obvious one is avoiding name collisions. The one that matters more as a codebase
        grows is drawing boundaries: a package is the only unit of grouping Java gives you that the compiler will
        actually enforce, through package-private access.
      </p>

      <h2>Naming</h2>
      <CodeBlock language="java" filename="conventions" code={naming} />
      <p>
        The reversed-domain convention exists so that two organisations can never accidentally pick the same fully
        qualified name. It's not enforced, but every library follows it, and yours should too.
      </p>

      <h2>How to organise packages</h2>
      <CodeBlock language="text" filename="two ways to split a codebase" code={byFeature} />
      <p>
        Layered packaging is the more common default and the weaker choice. Grouping by feature means a change lands
        in one place, and it makes package-private access useful: a repository can be invisible outside its own
        feature, so nothing else can reach around the service to the database.
      </p>

      <AnalogyCard title="A kitchen organised by meal, not by shape.">
        Nobody stores all the round things in one cupboard and all the square things in another. You keep the
        coffee, the filter and the mug together, because that's what you reach for at once. Packaging by layer is
        the shape-based cupboard: technically consistent, and it means every task involves opening three doors.
      </AnalogyCard>

      <h2>The classpath</h2>
      <CodeBlock language="bash" filename="finding classes at runtime" code={classpath} />
      <TerminalDemo
        title="Compile and run a packaged application"
        prompt="~/billing"
        steps={[
          {
            command: "find src -name '*.java'",
            output: [
              "src/com/example/billing/Invoice.java",
              "src/com/example/billing/Main.java",
            ],
            note: "The directory structure has to mirror the package declaration exactly — the compiler and the class loader both rely on it.",
          },
          {
            command: "javac -d out $(find src -name '*.java')",
            output: [],
            note: "-d puts the .class files in out/, recreating the package folders there. Compiling into the source tree is a habit worth breaking early.",
          },
          {
            command: "java -cp out com.example.billing.Main",
            output: ["Invoice INV-001 for 4200p"],
            note: "You pass the fully qualified class name, with dots. The classpath tells the JVM which directory to treat as the root of that name.",
          },
          {
            command: "java -cp out com/example/billing/Main",
            output: [
              "Error: Could not find or load main class com.example.billing.Main.class",
            ],
            note: "Slashes and the .class extension are for files, not for class names. This error is common enough to recognise on sight.",
          },
        ]}
      />

      <h2>Static imports</h2>
      <CodeBlock language="java" filename="importing members" code={staticImport} />

      <Callout variant="info" title="Modules: the layer above packages">
        Java 9 added the module system. A package can be public but unexported, so its classes are unreachable
        outside the module regardless of their access modifiers. Most application code still runs on the classpath
        and never declares a module — but the JDK itself is modular, which is why you occasionally see errors about
        an internal package "not being exported".
      </Callout>
      <CodeBlock language="java" filename="module-info.java" code={modules} />

      <CommonMistake
        title="making everything public by reflex"
        wrong={`package com.example.order;

public class OrderRepository { ... }      // used only by OrderService
public class OrderValidator { ... }       // used only by OrderService
public class OrderMapper { ... }          // used only by OrderService

// Every one of these is now part of your public API. Any code
// anywhere can depend on them, and you can never change them.`}
        right={`package com.example.order;

public class OrderService { ... }         // the one intended entry point

class OrderRepository { ... }             // package-private: internal
class OrderValidator { ... }
class OrderMapper { ... }

// Now the package has a surface of exactly one class, and the
// compiler enforces it.`}
        explanation={
          <p>
            Anything public is a promise to everyone who ever depends on your code. Package-private is the tool Java
            gives you for saying "this exists to serve the classes next to it" — and it only works if your packages
            group things that genuinely belong together. That's the practical reason to package by feature.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A package is a folder for your classes, and the folder structure has to match the package name. It stops
            two classes with the same name from clashing, and it lets you mark some classes as visible only to their
            neighbours.
          </p>
        }
        developer={
          <p>
            The class loader maps a binary name to a resource path, which is why package and directory must agree.
            The classpath is an ordered list of directories and jars searched left to right — the first match wins,
            which is the mechanism behind classpath-shadowing bugs. Package-private is the default access level and
            is enforced by the JVM at link time. The module system adds a stronger boundary: readability (
            <code>requires</code>) and accessibility (<code>exports</code>) are checked independently of access
            modifiers.
          </p>
        }
        interview={
          <p>
            Worth being able to say: package-private is the default and is genuinely useful for enforcing
            boundaries; the classpath is ordered and first-match-wins, which explains duplicate-class problems; and
            modules add strong encapsulation on top of packages, which is why <code>sun.misc.Unsafe</code>-style
            access started failing in Java 9+. Packaging by feature over by layer is a good opinion to hold, with a
            reason.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Two jars on the classpath both contain com.example.Util. What happens?"
        options={[
          { id: "a", text: "The JVM refuses to start with a duplicate class error" },
          { id: "b", text: "The one from the jar listed first on the classpath is used; the other is invisible" },
          { id: "c", text: "Both are loaded and the methods are merged" },
          { id: "d", text: "The one with the newer timestamp wins" },
        ]}
        correctId="b"
        explanation="The classpath is searched in order and the first match wins, silently. That is why a mismatched transitive dependency can produce a NoSuchMethodError at runtime despite compiling perfectly — you compiled against one version and ran against another."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Enforce a boundary with package-private"
        hint={
          <p>
            Remove <code>public</code> from the helper class and try to use it from a class in a different package.
            Then move the calling class into the same package and try again.
          </p>
        }
      >
        Create two packages where one contains a service and a helper. Make the helper package-private and prove
        that code in the other package cannot use it — then prove that code in the same package can. That's the
        smallest working demonstration of an enforced module boundary, and it needs no build tool at all.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is package-private access and when is it useful?"
        answer={
          <p>
            It's the default access level — no modifier at all — and it means a member or class is visible only to
            code in the same package. It's the only encapsulation boundary Java offers above the class level and
            below the module level, and it's genuinely useful for keeping a package's internals internal: helper
            classes, repositories, mappers and validators can be package-private so the package exposes exactly one
            or two public entry points that the compiler will enforce. It's also common in tests, since a test class
            in the same package can reach package-private members without weakening production access. The catch is
            that it only pays off if packages group things that belong together — with layer-based packaging, every
            class needs to be public because its collaborators live in other packages.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Package declaration and directory structure must match exactly — the class loader depends on it.",
          "Reverse-domain naming keeps fully qualified names globally unique.",
          "Package by feature, not by layer: changes stay local and package-private becomes useful.",
          "The classpath is ordered and first-match-wins, which is why duplicate classes fail silently.",
          "Modules add a stronger boundary than packages: a public class in an unexported package is unreachable.",
        ]}
      />
    </>
  )
}
