import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"
import { TypeHierarchyDiagram } from "@/components/diagram/type-hierarchy-diagram"

const categories = `Creational  — how objects get created
  Singleton, Factory Method, Abstract Factory, Builder, Prototype

Structural  — how objects are composed into larger structures
  Adapter, Decorator, Facade, Proxy, Composite, Bridge, Flyweight

Behavioural — how objects communicate and share responsibility
  Strategy, Observer, Template Method, Command, Iterator, State, ...

// This course covers the nine that come up most in real Java code
// and Java interviews, one per category-group.`

const inTheJdk = `Pattern           Where the JDK uses it
---------------   -----------------------------------------------
Singleton         Runtime.getRuntime(), Collections.emptyList()
Factory Method    Calendar.getInstance(), List.of(), valueOf(...)
Builder           StringBuilder, Stream.Builder, HttpRequest.newBuilder()
Strategy          Comparator passed to Collections.sort
Observer          the listener APIs in Swing; Flow.Subscriber (reactive)
Decorator         BufferedReader wrapping a FileReader (all of java.io)
Adapter           Arrays.asList (array -> List), InputStreamReader
Template Method   AbstractList, InputStream.read(), HttpServlet.service()
Proxy             java.lang.reflect.Proxy; every Spring @Transactional bean

// You have been using patterns since Hello World. Naming them is
// what lets a team discuss a design in two words instead of twenty.`

const notMagic = `// A pattern is a description of a solution, not a library you import.
// There is no 'import java.patterns.Singleton'. You recognise the
// shape of a recurring problem and apply the known-good structure.

// The danger is the opposite of not knowing them: applying them
// everywhere. A factory that only ever makes one class, a strategy
// interface with one implementation, a builder for a two-field record
// — these add indirection and earn nothing. Reach for a pattern when
// the problem it solves is actually present.`

export default function DesignPatternsOverviewLesson() {
  return (
    <>
      <p>
        A design pattern is a named, reusable solution to a problem that keeps coming up. It isn't code you copy —
        it's a <em>shape</em> you recognise, so that "use a factory here" communicates an entire design decision in
        three words. The Gang of Four catalogued twenty-three of them in 1994, and Java's own libraries are built
        from them.
      </p>

      <h2>Three categories</h2>
      <CodeBlock language="text" filename="the map" code={categories} />
      <p>
        The split is by <em>what the pattern is about</em>. Creational patterns take control of how objects are
        made. Structural patterns are about composing objects into bigger things. Behavioural patterns are about how
        objects talk to each other and divide up work. Knowing which drawer to open is half of choosing a pattern.
      </p>

      <TypeHierarchyDiagram
        title="The nine this course covers"
        initialSelected="creational"
        nodes={[
          {
            id: "creational",
            name: "Creational",
            kind: "interface",
            tag: "object creation",
            detail: "Control which class is instantiated, how, and how many. When 'new SomeClass()' scattered everywhere becomes a liability, a creational pattern centralises the decision.",
          },
          {
            id: "singleton",
            name: "Singleton",
            kind: "class",
            parent: "creational",
            tag: "exactly one",
            detail: "Guarantee a single shared instance with a global access point — done safely in Java with an enum.",
          },
          {
            id: "factory",
            name: "Factory Method",
            kind: "class",
            parent: "creational",
            tag: "which class?",
            detail: "A method decides which concrete class to create, so callers depend on an interface rather than a constructor.",
          },
          {
            id: "builder",
            name: "Builder",
            kind: "class",
            parent: "creational",
            tag: "many optional parts",
            detail: "Assemble a complex object step by step with named, readable calls instead of a giant constructor.",
          },
          {
            id: "structural",
            name: "Structural",
            kind: "interface",
            tag: "composition",
            detail: "Combine objects into larger structures while keeping them flexible — usually by wrapping one object in another.",
          },
          {
            id: "decorator",
            name: "Decorator",
            kind: "class",
            parent: "structural",
            tag: "wrap to add behaviour",
            detail: "Add responsibilities by wrapping an object in another of the same type — the java.io stream story.",
          },
          {
            id: "adapter",
            name: "Adapter",
            kind: "class",
            parent: "structural",
            tag: "make it fit",
            detail: "Wrap an object so it presents the interface some other code expects.",
          },
          {
            id: "proxy",
            name: "Proxy",
            kind: "class",
            parent: "structural",
            tag: "control access",
            detail: "A stand-in with the same interface as the real object, added to control or defer access to it — Spring's whole AOP model.",
          },
          {
            id: "behavioural",
            name: "Behavioural",
            kind: "interface",
            tag: "communication",
            detail: "Assign responsibilities and let objects collaborate without tight coupling.",
          },
          {
            id: "strategy",
            name: "Strategy",
            kind: "class",
            parent: "behavioural",
            tag: "swap the algorithm",
            detail: "Pass behaviour as an object so the algorithm can change at runtime — the pattern lambdas made trivial.",
          },
          {
            id: "observer",
            name: "Observer",
            kind: "class",
            parent: "behavioural",
            tag: "notify many",
            detail: "One subject notifies many listeners of a change without knowing who they are.",
          },
          {
            id: "template",
            name: "Template Method",
            kind: "class",
            parent: "behavioural",
            tag: "fixed skeleton",
            detail: "A base class fixes the order of steps and lets subclasses supply the varying ones.",
          },
        ]}
      />

      <h2>You already use them</h2>
      <CodeBlock language="text" filename="patterns in the standard library" code={inTheJdk} />

      <AnalogyCard title="Named opening moves in chess.">
        A strong player doesn't invent the board from scratch each game — they recognise "this is a Sicilian" and
        bring a known body of understanding to it. The moves were always legal; naming the pattern is what lets two
        players discuss a whole line of play in a word. Design patterns are the same for code: they were always
        possible, and the name is the shortcut.
      </AnalogyCard>

      <h2>A pattern is a shape, not an import</h2>
      <CodeBlock language="text" filename="what they are and aren't" code={notMagic} />

      <CommonMistake
        title="applying a pattern because you can, not because you need it"
        wrong={`// A "factory" that hides a single constructor behind ceremony
interface ShapeFactory { Shape create(); }
class CircleFactory implements ShapeFactory {
    public Shape create() { return new Circle(); }
}
ShapeFactory f = new CircleFactory();
Shape s = f.create();          // ...you could have written new Circle()`}
        right={`// Use the pattern when there is a real decision to centralise
Shape s = new Circle();        // one concrete type? just construct it

// A factory earns its place when the choice of class varies:
Shape s = ShapeFactory.forType(userSelectedType);`}
        explanation={
          <p>
            Patterns are tools for managing change and complexity that is actually present. Wrapping a single{" "}
            <code>new</code> in a factory, or defining a strategy interface that will only ever have one
            implementation, adds indirection and layers to read through while solving no problem. The skill is
            recognising when the problem a pattern solves has genuinely appeared — which is why every pattern in
            this course leads with the problem, not the solution.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Certain coding problems come up again and again, and over the years people worked out good solutions and
            gave them names. A design pattern is one of those named solutions. Learning them means you can recognise
            a familiar problem and reach for a proven answer instead of reinventing one.
          </p>
        }
        developer={
          <p>
            Patterns are language-independent design vocabulary. In Java they're realised with interfaces, abstract
            classes, composition and, increasingly, lambdas — Strategy, Command and Observer collapse to functional
            interfaces in modern Java. The GoF categories (creational, structural, behavioural) are a useful index,
            but the real value is shared vocabulary in code review and design discussion. The standard library is a
            catalogue of them, which makes the JDK source a good place to see each one applied well.
          </p>
        }
        interview={
          <p>
            Expect "name a pattern you've used and why". Answer with a real one from your work and the problem it
            solved, then name where the JDK uses it to show it isn't theoretical — <code>Comparator</code> is
            Strategy, <code>BufferedReader</code> is Decorator, <code>StringBuilder</code> is Builder. The strongest
            candidates also know when <em>not</em> to use one: over-applied patterns are a recognised code smell,
            and lambdas have made several of the classic ones a single line.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Which category does the Decorator pattern belong to?"
        options={[
          { id: "a", text: "Creational — it creates objects" },
          { id: "b", text: "Structural — it composes objects by wrapping one in another" },
          { id: "c", text: "Behavioural — it defines how objects communicate" },
          { id: "d", text: "It is not a Gang of Four pattern" },
        ]}
        correctId="b"
        explanation="Decorator is structural: it's about how objects are composed, specifically wrapping an object in another of the same type to add behaviour. Creational patterns are about making objects; behavioural ones are about how they collaborate."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Spot the patterns you already use"
        hint={
          <p>
            Look at any code that uses <code>Comparator</code>, <code>StringBuilder</code>, a{" "}
            <code>BufferedReader</code>, or a <code>List.of(...)</code> call.
          </p>
        }
      >
        Open a class you've written and find three places where you're already using a design pattern without
        having named it. For each, say which pattern it is and what problem it's solving there. If you can't find
        three, you're about to meet them in the next nine lessons.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is a design pattern, and are they still relevant in modern Java?"
        answer={
          <p>
            A design pattern is a named, reusable solution to a problem that recurs across many programs — a shape
            for structuring code, not a library. The Gang of Four grouped them into creational (how objects are
            made), structural (how they're composed) and behavioural (how they collaborate). They remain relevant
            for two reasons. First, shared vocabulary: saying "wrap it in a decorator" or "make that a strategy"
            conveys a whole design in a phrase during review. Second, the standard library is built from them, so
            reading and extending the JDK, or frameworks like Spring, means recognising them.{" "}
            <em>How</em> you implement several has changed, though — lambdas turned Strategy, Command and simple
            Observer callbacks into one-liners, and records plus sealed types cover cases that once needed more
            structure. The anti-pattern to avoid is applying them where the problem they solve isn't present, which
            just adds indirection.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "A design pattern is a named solution to a recurring problem — a shape you recognise, not code you import.",
          "Three categories: creational (making objects), structural (composing them), behavioural (collaboration).",
          "The JDK is a catalogue: Comparator is Strategy, BufferedReader is Decorator, StringBuilder is Builder.",
          "Lambdas have collapsed Strategy, Command and simple Observer into one-liners.",
          "The real skill is knowing when NOT to apply one — over-use is a code smell.",
        ]}
      />
    </>
  )
}
