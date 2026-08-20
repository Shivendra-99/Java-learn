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
import { Boxes, Cpu, Search, Play, Type } from "lucide-react"

const basic = `class Notification {
    void send(String to) {
        System.out.println("Generic notification to " + to);
    }
}

class EmailNotification extends Notification {
    @Override
    void send(String to) {
        System.out.println("Email to " + to);
    }
}

class SmsNotification extends Notification {
    @Override
    void send(String to) {
        System.out.println("SMS to " + to);
    }
}

// One loop, one declared type, three different behaviours
List<Notification> channels = List.of(
        new EmailNotification(),
        new SmsNotification(),
        new Notification());

for (Notification channel : channels) {
    channel.send("priya@example.com");     // the OBJECT decides which code runs
}
// Email to priya@example.com
// SMS to priya@example.com
// Generic notification to priya@example.com`

const rules = `class Parent {
    protected Number calculate(int input) throws IOException { ... }
}

class Child extends Parent {

    @Override
    public Integer calculate(int input) throws FileNotFoundException { ... }
    //  ^        ^                             ^
    //  |        |                             narrower exception: allowed
    //  |        covariant return (Integer IS-A Number): allowed
    //  wider access (protected -> public): allowed

    // NOT allowed:
    //   private Number calculate(int input)          — narrower access
    //   Number calculate(long input)                 — different signature: an OVERLOAD
    //   Number calculate(int i) throws Exception     — broader checked exception
}`

const overloadVsOverride = `class Base {
    void handle(Object o) { System.out.println("Base.handle(Object)"); }
}

class Derived extends Base {
    void handle(String s) { System.out.println("Derived.handle(String)"); }
    // NOT an override — different parameter type. This is an overload.
}

Base b = new Derived();
b.handle("hello");
// Base.handle(Object)
//
// The compiler picks handle(Object) from the declared type Base;
// Derived.handle(String) isn't even a candidate.`

const dispatchPredictor = `public class Dispatch {
    static class Animal {
        String name() { return "Animal"; }
        static String kind() { return "static Animal"; }
    }
    static class Dog extends Animal {
        @Override String name() { return "Dog"; }
        static String kind() { return "static Dog"; }
    }

    public static void main(String[] args) {
        Animal a = new Dog();
        System.out.println(a.name() + " / " + Animal.kind());
    }
}`

const instanceOf = `// Old style
if (shape instanceof Circle) {
    Circle circle = (Circle) shape;
    area = circle.radius() * circle.radius() * Math.PI;
}

// Pattern matching (Java 16+): test and bind in one step
if (shape instanceof Circle circle) {
    area = circle.radius() * circle.radius() * Math.PI;
}

// Better still — let polymorphism do the work and delete the check entirely
area = shape.area();`

export default function PolymorphismLesson() {
  return (
    <>
      <p>
        Polymorphism means one reference type can stand for many actual types, and the object — not the variable —
        decides which code runs. It's the mechanism that lets you add a new kind of thing to a system without
        editing the code that uses it, and it's what makes the rest of object-oriented design worth doing.
      </p>

      <h2>One call, several behaviours</h2>
      <CodeBlock language="java" filename="dynamic dispatch" code={basic} />
      <p>
        The loop is written against <code>Notification</code> and knows nothing about email or SMS. Add a{" "}
        <code>PushNotification</code> tomorrow and the loop doesn't change — which is the entire point.
      </p>

      <h2>How the JVM decides</h2>
      <StepFlowDiagram
        title="Resolving channel.send(to) at runtime"
        steps={[
          {
            id: "compile",
            label: "Compile time",
            detail:
              "javac checks that the declared type — Notification — has a send(String) method. If it doesn't, the code doesn't compile. This check is about the reference type only.",
            icon: Type,
          },
          {
            id: "emit",
            label: "invokevirtual",
            detail:
              "The compiler emits an invokevirtual instruction naming Notification.send. It does not decide which implementation runs — it can't, since the object doesn't exist yet.",
            icon: Cpu,
          },
          {
            id: "runtime-type",
            label: "Find the real class",
            detail:
              "At runtime the JVM looks at the object the reference actually points to — say EmailNotification — via the header every object carries.",
            icon: Search,
          },
          {
            id: "vtable",
            label: "Look up the method table",
            detail:
              "Each class has a table of method implementations. The JVM finds the entry for send in EmailNotification's table, which points at the override rather than the inherited version.",
            icon: Boxes,
          },
          {
            id: "invoke",
            label: "Run the override",
            detail:
              "EmailNotification.send executes. If one type dominates at this call site, the JIT will inline it and add a guard — making a virtual call almost free in practice.",
            icon: Play,
            tone: "success",
          },
        ]}
      />

      <AnalogyCard title="Asking every performer to 'do your act'.">
        A compère announces the same words to a juggler, a singer and a comedian. The instruction is identical; what
        happens next depends entirely on who's standing there. The compère doesn't need a list of every possible
        act — and when a magician joins the bill, the script stays the same.
      </AnalogyCard>

      <h2>The rules for a valid override</h2>
      <CodeBlock language="java" filename="what can change" code={rules} />
      <p>
        The summary: same name and parameter types, return type the same or a subtype, access the same or wider,
        checked exceptions the same or narrower. Everything else is a compile error — or worse, an accidental
        overload.
      </p>

      <Callout variant="tip" title="Always write @Override">
        It's optional, and it's the cheapest bug prevention in Java. If your method doesn't actually override
        anything — a typo in the name, a parameter of the wrong type — the compiler tells you immediately instead of
        silently adding a method nobody calls.
      </Callout>

      <h2>Overloading is not overriding</h2>
      <CodeBlock language="java" filename="a common trap" code={overloadVsOverride} />
      <p>
        Overloading is chosen by the compiler from declared types. Overriding is chosen by the JVM from the actual
        object. Two different mechanisms that happen to look similar in source code — and the difference is a
        near-guaranteed interview question.
      </p>

      <OutputPredictor
        code={dispatchPredictor}
        options={[
          { id: "a", text: "Dog / static Animal" },
          { id: "b", text: "Dog / static Dog" },
          { id: "c", text: "Animal / static Animal" },
          { id: "d", text: "Animal / static Dog" },
        ]}
        correctId="a"
        explanation={
          <p>
            <code>name()</code> is an instance method, so it dispatches on the runtime type — the object is a{" "}
            <code>Dog</code>, so "Dog". <code>kind()</code> is static and is being called on the class{" "}
            <code>Animal</code> explicitly, so it resolves at compile time to Animal's version. Static methods are
            hidden, not overridden, and calling one through an instance reference (<code>a.kind()</code>) would
            likewise use the declared type — which is why every linter warns about it.
          </p>
        }
      />

      <h2>instanceof and pattern matching</h2>
      <CodeBlock language="java" filename="type checks" code={instanceOf} />
      <p>
        Pattern matching removes the cast, which removes a chance to get it wrong. But note the last line: a chain
        of <code>instanceof</code> checks is usually polymorphism you haven't written yet. Push the behaviour onto
        the types and the checks disappear.
      </p>

      <CommonMistake
        title="switching on type instead of using polymorphism"
        wrong={`double area(Shape shape) {
    if (shape instanceof Circle c) {
        return Math.PI * c.radius() * c.radius();
    } else if (shape instanceof Square s) {
        return s.side() * s.side();
    }
    throw new IllegalArgumentException("unknown shape");
}
// Every new shape means editing this method — and every
// other method that does the same thing elsewhere.`}
        right={`interface Shape {
    double area();
}

record Circle(double radius) implements Shape {
    public double area() { return Math.PI * radius * radius; }
}

record Square(double side) implements Shape {
    public double area() { return side * side; }
}

double area = shape.area();   // adding Triangle changes nothing here`}
        explanation={
          <p>
            The type-check version puts knowledge of every shape into every method that handles shapes. The
            polymorphic version puts each shape's knowledge inside that shape. Adding a type then touches exactly
            one new file instead of every existing one — the practical meaning of the open/closed principle. (The
            exception: with <code>sealed</code> types, a switch over a closed set is checked for exhaustiveness by
            the compiler and is a legitimate design.)
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            You can store different kinds of object in a variable of a shared type, and when you call a method the
            object's own version runs. That lets you write one piece of code that handles kinds of thing that didn't
            exist when you wrote it.
          </p>
        }
        developer={
          <p>
            Instance methods are virtual by default and dispatched through <code>invokevirtual</code> (or{" "}
            <code>invokeinterface</code>) using the object's class pointer and method table. Overriding rules:
            identical signature, covariant return type, access no narrower, checked exceptions no broader. Fields,
            static methods, private methods and constructors are <em>not</em> polymorphic — they bind statically. In
            practice the JIT inlines monomorphic and bimorphic call sites behind a guard, so virtual dispatch is
            rarely a measurable cost.
          </p>
        }
        interview={
          <p>
            The core comparison: overloading is compile-time (static binding, chosen from declared parameter types)
            and overriding is runtime (dynamic binding, chosen from the object's class). Follow-ups worth
            pre-loading: covariant return types are allowed since Java 5; you cannot override a{" "}
            <code>final</code>, <code>static</code> or <code>private</code> method; and a chain of{" "}
            <code>instanceof</code> is usually a design smell unless the hierarchy is <code>sealed</code>.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Which of these differences between a parent method and a child method makes it an overload rather than an override?"
        options={[
          { id: "a", text: "The child returns Integer where the parent returns Number" },
          { id: "b", text: "The child is public where the parent is protected" },
          { id: "c", text: "The child takes a long where the parent takes an int" },
          { id: "d", text: "The child throws a narrower checked exception" },
        ]}
        correctId="c"
        explanation="Different parameter types mean a different signature, so it's a new method that happens to share a name — an overload. The other three are all legal variations on a genuine override: covariant return, wider access, narrower exceptions."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Add a type without touching the caller"
        hint={
          <p>
            Write the processing loop against the interface only. If you find yourself needing{" "}
            <code>instanceof</code> in it, the behaviour you need probably belongs on the interface.
          </p>
        }
      >
        Build a small <code>PaymentMethod</code> interface with two implementations and a method that processes a
        list of them. Then add a third implementation <em>without editing the processing method at all</em>. If you
        can't, the interface is missing an operation — find out which, and add it.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the difference between method overloading and method overriding?"
        answer={
          <p>
            <strong>Overloading</strong> is several methods in the same class sharing a name but differing in
            parameter types. The compiler chooses between them at compile time using the declared types of the
            arguments — it's static binding, and the return type plays no part.{" "}
            <strong>Overriding</strong> is a subclass replacing a parent method with the identical signature. The
            JVM chooses at runtime based on the object's actual class — dynamic binding. The practical consequence:
            with <code>Base b = new Derived()</code>, an overridden method runs Derived's version, whereas an
            overloaded call, a field access, or a static method all resolve using <code>Base</code>. Overloading is
            about convenience; overriding is what makes polymorphism work.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Instance methods dispatch on the object's runtime type — that's polymorphism.",
          "Overloading is compile-time and uses declared types; overriding is runtime and uses the real type.",
          "A valid override keeps the signature, may return a subtype, may widen access, and may narrow checked exceptions.",
          "Always annotate with @Override — it turns a silent accidental overload into a compile error.",
          "A chain of instanceof checks usually means behaviour that belongs on the types themselves.",
        ]}
      />
    </>
  )
}
