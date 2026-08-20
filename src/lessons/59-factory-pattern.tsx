import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"
import { TypeHierarchyDiagram } from "@/components/diagram/type-hierarchy-diagram"

const problem = `// The problem: callers hard-wired to concrete classes
public Notification create(String channel) {
    if (channel.equals("email")) return new EmailNotification();
    if (channel.equals("sms"))   return new SmsNotification();
    ...
}
// Every caller that does this repeats the switch. Add a channel and
// you edit all of them. The choice of concrete class is scattered.

// Factory Method (creational): move the 'which class?' decision into
// one place, so callers depend only on the interface.`

const staticFactory = `// The simplest form, and the one you use daily: a static factory method
public sealed interface Notification permits EmailNotification, SmsNotification {
    void send(String to, String message);

    static Notification of(Channel channel) {     // the factory
        return switch (channel) {
            case EMAIL -> new EmailNotification();
            case SMS   -> new SmsNotification();
        };
    }
}

Notification n = Notification.of(Channel.EMAIL);   // caller never names a concrete class
n.send("a@b.com", "hi");

// The JDK is full of these: Integer.valueOf, List.of, Optional.of,
// LocalDate.now, Collections.emptyList. They can cache, return a
// subtype, or pick an implementation — things a constructor can't.`

const factoryMethod = `// Factory Method proper: subclasses decide the product
abstract class Dialog {
    // The template calls the factory method; subclasses supply the button
    public void render() {
        Button ok = createButton();      // the factory method
        ok.onClick(this::close);
        ok.draw();
    }
    protected abstract Button createButton();   // deferred to subclasses
}

class WindowsDialog extends Dialog {
    protected Button createButton() { return new WindowsButton(); }
}
class WebDialog extends Dialog {
    protected Button createButton() { return new HtmlButton(); }
}`

const abstractFactory = `// Abstract Factory: a factory that makes a FAMILY of related products
interface GuiFactory {
    Button createButton();
    Checkbox createCheckbox();
}

class MacFactory implements GuiFactory {
    public Button createButton()     { return new MacButton(); }
    public Checkbox createCheckbox() { return new MacCheckbox(); }
}
class WindowsFactory implements GuiFactory {
    public Button createButton()     { return new WindowsButton(); }
    public Checkbox createCheckbox() { return new WindowsCheckbox(); }
}

// Pick the family once; everything after is consistent
GuiFactory factory = onMac ? new MacFactory() : new WindowsFactory();
Button b = factory.createButton();        // guaranteed to match the checkbox
Checkbox c = factory.createCheckbox();`

const constructorVsFactory = `Constructor                     Static factory method
-----------------------------   -----------------------------------------
always returns a NEW instance   may return a cached or shared instance
name is fixed (the class name)  has a descriptive name (of, valueOf, from)
returns exactly this class      may return any subtype
cannot fail to produce one      can, e.g. Optional-returning variants

// This is why Effective Java Item 1 is 'consider static factory
// methods instead of constructors'.`

export default function FactoryPatternLesson() {
  return (
    <>
      <p>
        A factory decides <em>which class</em> to instantiate so that callers don't have to. It's the pattern that
        lets code depend on an interface rather than a constructor — and it comes in three sizes, from the static
        factory method you already use to the abstract factory that produces whole families of objects.
      </p>

      <CodeBlock language="text" filename="the problem" code={problem} />

      <h2>Static factory methods</h2>
      <CodeBlock language="java" filename="the everyday form" code={staticFactory} />
      <Callout variant="info" title="You've used these since day one">
        <code>Integer.valueOf(5)</code>, <code>List.of(...)</code>, <code>Optional.ofNullable(x)</code> and{" "}
        <code>LocalDate.now()</code> are all static factories. Each does something a constructor can't: cache and
        reuse instances, choose which concrete class to return, or give the creation a name that documents intent.
      </Callout>

      <h2>Factory Method vs Abstract Factory</h2>
      <TypeHierarchyDiagram
        title="Two named patterns, one family"
        initialSelected="fm"
        nodes={[
          {
            id: "fm",
            name: "Factory Method",
            kind: "abstract",
            tag: "one product",
            detail:
              "A method — often abstract, overridden by subclasses — decides which single product to create. The parent's algorithm calls it without knowing the concrete type. Dialog.createButton() is the classic shape.",
          },
          {
            id: "windows",
            name: "WindowsDialog",
            kind: "class",
            parent: "fm",
            tag: "makes WindowsButton",
            detail: "A subclass that fixes the product by overriding the factory method. render() is inherited unchanged and gets a WindowsButton.",
          },
          {
            id: "web",
            name: "WebDialog",
            kind: "class",
            parent: "fm",
            tag: "makes HtmlButton",
            detail: "A sibling that produces a different button from the same inherited algorithm.",
          },
          {
            id: "af",
            name: "Abstract Factory",
            kind: "interface",
            tag: "a family of products",
            detail:
              "An interface with several factory methods that together create a matched set — a button AND a checkbox AND a menu that all belong to the same look. You pick the factory once and everything it makes is consistent.",
          },
          {
            id: "mac",
            name: "MacFactory",
            kind: "class",
            parent: "af",
            tag: "Mac-styled set",
            detail: "Implements every factory method to return the Mac variant, guaranteeing the button and checkbox match.",
          },
          {
            id: "winf",
            name: "WindowsFactory",
            kind: "class",
            parent: "af",
            tag: "Windows-styled set",
            detail: "The parallel family. Swapping factories swaps the entire look in one line, and mixing is impossible by construction.",
          },
        ]}
      />
      <CodeBlock language="java" filename="Factory Method" code={factoryMethod} />
      <CodeBlock language="java" filename="Abstract Factory" code={abstractFactory} />

      <AnalogyCard title="Ordering 'the house red' instead of naming a wine.">
        You ask for the house red and the restaurant decides which specific bottle that is today. You're insulated
        from the choice — they can switch supplier without you changing your order. A factory is the same: you ask
        for a <em>kind</em> of thing, and one place decides the exact class, free to change it without touching a
        single caller.
      </AnalogyCard>

      <h2>Why a factory over a constructor?</h2>
      <CodeBlock language="text" filename="the trade" code={constructorVsFactory} />

      <CommonMistake
        title="a factory that removes no decision"
        wrong={`interface UserFactory { User create(String name); }
class DefaultUserFactory implements UserFactory {
    public User create(String name) { return new User(name); }
}
UserFactory factory = new DefaultUserFactory();
User u = factory.create("Ana");
// Two extra types and a layer of indirection to call one constructor.`}
        right={`// If there's only ever one product, just construct it
User u = new User("Ana");

// Or a static factory when creation genuinely varies or benefits
// from caching / a name:
User guest = User.guest();
User u = User.fromRecord(dbRow);`}
        explanation={
          <p>
            A factory pays for itself when the concrete class actually varies, when creation can be cached, or when
            a descriptive name adds clarity. Wrapping a single constructor in a factory interface with one
            implementation buys nothing but layers. The question to ask: is there a real decision about{" "}
            <em>which</em> object to make? If not, <code>new</code> is the honest answer.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A factory is a method whose job is to create an object for you and decide exactly what type it is. You
            ask for "an email notification" and it hands one back, so your code never mentions the specific class —
            which means that class can change without breaking you.
          </p>
        }
        developer={
          <p>
            The static factory method (Effective Java Item 1) is the pragmatic default: a named method that can
            cache, return a subtype, or fail gracefully. Factory Method proper defers instantiation to subclasses
            via an overridable method the base algorithm calls. Abstract Factory groups several factory methods so a
            client creates a consistent family of products by choosing one factory. All three exist to program to
            an interface and localise the <code>new</code> — the difference is scope: one product, subclass-chosen
            product, or a whole product family.
          </p>
        }
        interview={
          <p>
            The reliable question is Factory Method versus Abstract Factory. Factory Method creates one product and
            uses inheritance — a subclass overrides the method. Abstract Factory creates a family of related
            products and uses composition — the client holds a factory object. Mention static factory methods too,
            with JDK examples (<code>valueOf</code>, <code>of</code>, <code>getInstance</code>), and the three
            things they do that constructors can't: cache, return a subtype, and carry a descriptive name.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="What is the key difference between Factory Method and Abstract Factory?"
        options={[
          { id: "a", text: "Factory Method is static; Abstract Factory is not" },
          { id: "b", text: "Factory Method creates one product via subclassing; Abstract Factory creates a family of related products via a factory object" },
          { id: "c", text: "Abstract Factory can only be used with abstract classes" },
          { id: "d", text: "There is no real difference" },
        ]}
        correctId="b"
        explanation="Factory Method defers the creation of a single product to a subclass that overrides the method. Abstract Factory bundles several factory methods so a client obtains a whole matched family — a button, a checkbox, a menu — by selecting one factory. One uses inheritance for one product; the other uses composition for a family."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Turn a scattered switch into a factory"
        hint={
          <p>
            Put a <code>static of(...)</code> method on the interface, and switch over a sealed set or an enum so
            the compiler checks you've covered every case.
          </p>
        }
      >
        Find (or write) code where several callers each do <code>if (type == ...) new X() else new Y()</code>. Move
        that decision into a single static factory on the interface, and update the callers to use it. Then add a
        third type and confirm you only had to touch the factory — that's the payoff.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Why would you use a static factory method instead of a constructor?"
        answer={
          <p>
            Four reasons, from <em>Effective Java</em>. First, a factory has a <strong>name</strong>, so{" "}
            <code>BigInteger.probablePrime(...)</code> reads better than a constructor with a boolean flag, and you
            can have several differently-named creators with the same parameter types, which overloaded
            constructors can't. Second, it <strong>needn't create a new object</strong> every call —{" "}
            <code>Integer.valueOf</code> returns cached instances, and <code>Boolean.valueOf</code> never allocates
            — which enables instance control and singletons. Third, it can <strong>return a subtype</strong>,
            including a non-public one, so the API exposes an interface while the implementation stays hidden;{" "}
            <code>List.of</code> returns different concrete classes depending on the argument count, and callers
            never know. Fourth, it can <strong>vary the returned class</strong> based on the arguments, or fail
            cleanly via an <code>Optional</code> return. The trade-offs are that a class with only private
            constructors can't be subclassed, and factory methods are harder to spot than constructors — which the
            naming conventions (<code>of</code>, <code>valueOf</code>, <code>from</code>, <code>getInstance</code>)
            help with.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "A factory centralises the 'which concrete class?' decision so callers depend on an interface.",
          "Static factory methods (of, valueOf, getInstance) are the everyday form and pervade the JDK.",
          "They can cache, return a subtype, and carry a descriptive name — things constructors can't.",
          "Factory Method defers one product to a subclass; Abstract Factory creates a whole family via a factory object.",
          "Don't wrap a single constructor in a factory — a pattern needs a real decision to earn its keep.",
        ]}
      />
    </>
  )
}
