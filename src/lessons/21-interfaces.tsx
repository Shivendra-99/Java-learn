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
import { TypeHierarchyDiagram } from "@/components/diagram/type-hierarchy-diagram"

const basic = `public interface PaymentMethod {
    // Implicitly public and abstract — writing those keywords is redundant
    PaymentResult charge(long amountPence);

    boolean supportsRefunds();
}

public class CardPayment implements PaymentMethod {
    @Override
    public PaymentResult charge(long amountPence) { ... }

    @Override
    public boolean supportsRefunds() { return true; }
}

public class VoucherPayment implements PaymentMethod {
    @Override
    public PaymentResult charge(long amountPence) { ... }

    @Override
    public boolean supportsRefunds() { return false; }
}

// Code depends on the capability, never on a specific implementation
void checkout(PaymentMethod method, long total) {
    PaymentResult result = method.charge(total);
}`

const multiple = `// A class implements as many interfaces as it likes
public class AuditLog implements Closeable, Iterable<Entry>, Comparable<AuditLog> {
    @Override public void close() { ... }
    @Override public Iterator<Entry> iterator() { ... }
    @Override public int compareTo(AuditLog other) { ... }
}

// Interfaces can extend several interfaces too
public interface ReadWriteStore extends ReadableStore, WritableStore { }`

const members = `public interface Validator<T> {

    // 1. Abstract method — the contract
    boolean isValid(T value);

    // 2. Default method (Java 8+) — an implementation implementers inherit
    default Validator<T> and(Validator<T> other) {
        return value -> this.isValid(value) && other.isValid(value);
    }

    // 3. Static method — a factory or helper, not inherited by implementers
    static <T> Validator<T> notNull() {
        return value -> value != null;
    }

    // 4. Private method (Java 9+) — shared logic between default methods
    private void log(String message) { System.out.println(message); }

    // 5. Constant — implicitly public static final
    int MAX_LENGTH = 255;
}`

const diamond = `interface Walker {
    default String move() { return "walking"; }
}
interface Swimmer {
    default String move() { return "swimming"; }
}

class Duck implements Walker, Swimmer {
    // Compile error without this: Duck inherits unrelated
    // defaults for move() from Walker and Swimmer
    @Override
    public String move() {
        return Walker.super.move() + " and " + Swimmer.super.move();
    }
}`

const constantPredictor = `public class Fields {
    interface Config {
        int TIMEOUT = 30;
    }

    static class Service implements Config {
        int describe() { return TIMEOUT; }
    }

    public static void main(String[] args) {
        System.out.println(new Service().describe() + " " + Config.TIMEOUT);
    }
}`

const functional = `@FunctionalInterface          // optional, but it makes the intent compiler-checked
public interface Command {
    void execute();           // exactly one abstract method
}

// Which means a lambda can implement it
Command save = () -> repository.save(order);
save.execute();

// java.lang.Runnable, java.util.Comparator and the whole
// java.util.function package work exactly this way.`

export default function InterfacesLesson() {
  return (
    <>
      <p>
        An interface is a contract: a list of things a type can do, with no statement about how. It's the single
        most important tool for keeping large Java systems flexible, because code written against an interface
        doesn't have to change when the implementation does.
      </p>

      <h2>Declaring and implementing</h2>
      <CodeBlock language="java" filename="PaymentMethod.java" code={basic} />
      <p>
        Interface methods are implicitly <code>public abstract</code> and interface fields implicitly{" "}
        <code>public static final</code>. Writing those modifiers out is legal and redundant; most codebases omit
        them.
      </p>

      <h2>A class can implement many</h2>
      <CodeBlock language="java" filename="multiple interfaces" code={multiple} />
      <p>
        This is the payoff for Java's single-inheritance rule for classes. A class has one parent but any number of
        capabilities, and unrelated types can share a capability without sharing an ancestor —{" "}
        <code>String</code> and <code>LocalDate</code> are both <code>Comparable</code> despite having nothing else
        in common.
      </p>

      <TypeHierarchyDiagram
        title="Capabilities cut across the class hierarchy"
        initialSelected="comparable"
        nodes={[
          {
            id: "comparable",
            name: "Comparable<T>",
            kind: "interface",
            tag: "one method",
            detail:
              "Declares compareTo. Any type that implements it can be sorted by Collections.sort, put in a TreeSet, or used as a TreeMap key — regardless of what else it is.",
          },
          {
            id: "string",
            name: "String",
            kind: "final",
            parent: "comparable",
            detail: "A final class implementing Comparable<String>. Nothing about its ancestry is shared with the types below it.",
          },
          {
            id: "localdate",
            name: "LocalDate",
            kind: "final",
            parent: "comparable",
            detail: "Also Comparable, also final, entirely unrelated to String — yet both work with the same sorting code.",
          },
          {
            id: "invoice",
            name: "Invoice",
            kind: "class",
            parent: "comparable",
            tag: "your class",
            detail: "Implement Comparable on your own type and it immediately works with every sorted collection in the JDK. That is the value of a shared contract.",
          },
        ]}
      />

      <h2>Everything an interface can contain</h2>
      <CodeBlock language="java" filename="five kinds of member" code={members} />

      <Callout variant="info" title="Why default methods exist">
        Adding a method to an interface used to break every implementer in the world. When Java 8 needed to add{" "}
        <code>stream()</code> to <code>Collection</code>, that was impossible — so default methods were introduced,
        letting an interface ship an implementation that existing classes inherit for free. They're a compatibility
        mechanism first; a design tool second.
      </Callout>

      <h2>Conflicting defaults</h2>
      <CodeBlock language="java" filename="the little diamond" code={diamond} />
      <p>
        Two interfaces with the same default method is the only situation where Java asks you to choose. The rule is
        simple and strict: the class must override the method, and can delegate with{" "}
        <code>InterfaceName.super.method()</code>. Note that a class's own methods always win over any inherited
        default.
      </p>

      <h2>Interface constants are inherited — carefully</h2>
      <OutputPredictor
        code={constantPredictor}
        options={[
          { id: "a", text: "30 30" },
          { id: "b", label: "It does not compile — TIMEOUT is not accessible in Service", text: "" },
          { id: "c", text: "0 30" },
          { id: "d", label: "It throws at runtime", text: "" },
        ]}
        correctId="a"
        explanation={
          <p>
            Interface fields are implicitly <code>public static final</code>, and implementing the interface brings
            them into scope, so <code>TIMEOUT</code> resolves without qualification. This works — but the "constant
            interface" pattern is widely considered an anti-pattern: it puts an implementation detail into the
            class's public API, since anyone can now write <code>Service.TIMEOUT</code>. Prefer a final class of
            constants, or an enum.
          </p>
        }
      />

      <h2>Functional interfaces</h2>
      <CodeBlock language="java" filename="one abstract method" code={functional} />
      <p>
        An interface with exactly one abstract method can be implemented by a lambda. That single rule is what makes
        the entire modern half of Java — streams, <code>Optional</code>, <code>CompletableFuture</code> — possible.
        The lambdas lesson later builds directly on this.
      </p>

      <AnalogyCard title="A plug socket, not a specific appliance.">
        The socket in your wall specifies a shape, a voltage and nothing else. It has no opinion about whether
        you're plugging in a kettle or a laptop charger, and both work without the wall being rewired. Program
        against the socket — the interface — and you can swap the appliance whenever you like.
      </AnalogyCard>

      <CommonMistake
        title="declaring variables and parameters with the implementation type"
        wrong={`ArrayList<String> names = new ArrayList<>();

public void process(ArrayList<String> names) { ... }
public HashMap<String, User> loadUsers() { ... }

// Switching to LinkedList or a concurrent map means
// changing every signature that mentions the concrete type.`}
        right={`List<String> names = new ArrayList<>();

public void process(List<String> names) { ... }
public Map<String, User> loadUsers() { ... }

// The implementation is now an internal decision.`}
        explanation={
          <p>
            "Program to an interface" is most concrete right here. Declare the variable, the parameter and the
            return type as the interface, and let only the <code>new</code> mention the implementation. Callers then
            depend on what the value <em>does</em>, not on how it's stored — and swapping the implementation is a
            one-line change instead of a refactor.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            An interface is a list of things a class promises to be able to do, with no code for how. Classes say{" "}
            <code>implements</code> and then supply the methods. Other code can then work with anything that keeps
            the promise, without caring which class it actually got.
          </p>
        }
        developer={
          <p>
            Members are implicitly public; fields are <code>public static final</code>. Since Java 8 an interface
            may declare <code>default</code> and <code>static</code> methods, and since Java 9 <code>private</code>{" "}
            ones for shared internals. Dispatch uses <code>invokeinterface</code>. Conflicting inherited defaults
            must be resolved by an override, with <code>X.super.m()</code> available for delegation; class methods
            always beat interface defaults, and a more specific interface beats a less specific one.
          </p>
        }
        interview={
          <p>
            Expect abstract class versus interface, and be ready with: no instance state, no constructors, many can
            be implemented, members implicitly public. Then the modern additions — default methods and why they
            exist (binary compatibility when <code>Collection</code> gained <code>stream()</code>), static and
            private methods, functional interfaces and lambdas, and the fact that Java resolves the diamond by
            requiring an explicit override rather than picking silently.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="A class implements two interfaces that both declare the same default method. What happens?"
        options={[
          { id: "a", text: "The first interface in the implements clause wins" },
          { id: "b", text: "It is a compile error unless the class overrides the method" },
          { id: "c", text: "Both run, in declaration order" },
          { id: "d", text: "The JVM picks one at runtime" },
        ]}
        correctId="b"
        explanation="Java refuses to guess. The class must override the method, and inside the override it can call either version explicitly with Walker.super.move(). Silent selection would make behaviour depend on the order of an implements clause, which nobody would expect to be significant."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Swap an implementation without touching the caller"
        hint={
          <p>
            Every type in the calling code — parameters, fields, return types — should be the interface. Only the
            line that constructs the object should name a class.
          </p>
        }
      >
        Write a <code>UserStore</code> interface with save and find operations, plus an in-memory implementation
        backed by a <code>Map</code>. Write a service that uses it. Now add a second implementation that writes to a
        file, and switch the service to use it by changing exactly one line. If you had to change more, find out
        which type leaked.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What are default methods and why were they added to Java 8?"
        answer={
          <p>
            A default method is an interface method with an implementation, inherited by every implementer that
            doesn't override it. They were added for <strong>binary compatibility</strong>: Java 8 needed to add{" "}
            <code>stream()</code>, <code>forEach()</code> and others to <code>Collection</code> and{" "}
            <code>Iterable</code>, and under the old rules that would have broken every existing implementation of
            those interfaces, in every library, everywhere. Defaults let an interface evolve without that breakage.
            They also enable small composable APIs — <code>Comparator.thenComparing</code>,{" "}
            <code>Predicate.and</code> — where the interface supplies combinators built on its single abstract
            method. The trade-off is a limited multiple-inheritance problem, resolved by requiring an explicit
            override when two interfaces supply conflicting defaults. They still cannot hold state, which is the
            line that keeps them distinct from abstract classes.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "An interface is a contract with no state; members are implicitly public, fields implicitly static final.",
          "A class implements any number of interfaces — capability crosses the inheritance tree.",
          "default methods let interfaces evolve without breaking implementers; static and private members are allowed too.",
          "Conflicting defaults are a compile error until the class overrides, and can delegate via Interface.super.method().",
          "One abstract method makes it a functional interface, which a lambda can implement.",
        ]}
      />
    </>
  )
}
