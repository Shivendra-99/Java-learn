import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { OutputPredictor } from "@/components/lesson/output-predictor"
import { Quiz } from "@/components/lesson/quiz"
import { TypeHierarchyDiagram } from "@/components/diagram/type-hierarchy-diagram"

const basic = `public class Vehicle {
    protected final String registration;
    private int mileage;

    public Vehicle(String registration) {
        this.registration = registration;
    }

    public void drive(int miles) {
        mileage += miles;
    }

    public int mileage() { return mileage; }
}

public class Van extends Vehicle {
    private final double loadCapacityTonnes;

    public Van(String registration, double loadCapacityTonnes) {
        super(registration);                    // must be first
        this.loadCapacityTonnes = loadCapacityTonnes;
    }

    // New behaviour, on top of everything Vehicle offers
    public boolean canCarry(double tonnes) {
        return tonnes <= loadCapacityTonnes;
    }
}

Van van = new Van("AB12 CDE", 1.5);
van.drive(120);              // inherited from Vehicle
van.canCarry(0.8);           // declared on Van
van.mileage();               // 120`

const superKeyword = `public class Van extends Vehicle {

    @Override
    public void drive(int miles) {
        super.drive(miles);                 // run the parent's version first
        logTelematics(miles);               // then add behaviour
    }

    @Override
    public String toString() {
        return "Van " + registration;       // protected field, visible here
    }
}`

const chainOrder = `class A {
    A() { System.out.println("A constructor"); }
}
class B extends A {
    B() { System.out.println("B constructor"); }   // implicit super() first
}
class C extends B {
    C() { System.out.println("C constructor"); }
}

new C();
// A constructor
// B constructor
// C constructor
//
// Construction runs top-down: the base of the object is built first.`

const hidePredictor = `public class Shadow {
    static class Parent {
        String label = "parent";
        String describe() { return "Parent"; }
    }
    static class Child extends Parent {
        String label = "child";
        @Override String describe() { return "Child"; }
    }

    public static void main(String[] args) {
        Parent p = new Child();
        System.out.println(p.label + " " + p.describe());
    }
}`

const finalKeyword = `// final class: cannot be extended at all
public final class String { ... }        // and Integer, LocalDate, ...

// final method: subclasses cannot override this one
public class Account {
    public final boolean isValid() { ... }
}

// Sealed (Java 17+): a controlled list of permitted subclasses
public sealed class Shape permits Circle, Square, Triangle { }`

export default function InheritanceLesson() {
  return (
    <>
      <p>
        Inheritance lets one class build on another: the subclass gets everything the parent has, and adds or
        changes what it needs. It's the most over-used feature in object-oriented programming, and it's still
        essential — the trick is knowing that <code>extends</code> means "is a kind of", not "wants to reuse some
        code".
      </p>

      <h2>extends</h2>
      <CodeBlock language="java" filename="Vehicle and Van" code={basic} />
      <p>
        <code>Van</code> inherits every non-private member of <code>Vehicle</code>. It can't see{" "}
        <code>mileage</code> directly — that's private — but it can call <code>drive</code> and{" "}
        <code>mileage()</code>, which is exactly the point of encapsulation surviving into subclasses.
      </p>

      <h2>Everything descends from Object</h2>
      <TypeHierarchyDiagram
        title="Every class has a parent, whether you write one or not"
        initialSelected="object"
        nodes={[
          {
            id: "object",
            name: "Object",
            kind: "class",
            detail:
              "The implicit parent of every class. It supplies toString, equals, hashCode, getClass, and the wait/notify methods — which is why any object can be printed or put in a collection.",
          },
          {
            id: "vehicle",
            name: "Vehicle",
            kind: "class",
            parent: "object",
            detail: "Declares no parent, so it extends Object implicitly. Holds the state and behaviour every vehicle shares.",
          },
          {
            id: "van",
            name: "Van",
            kind: "class",
            parent: "vehicle",
            tag: "adds load capacity",
            detail: "Adds its own field and behaviour, and may override Vehicle's methods. A Van IS-A Vehicle, so it can be used anywhere a Vehicle is expected.",
          },
          {
            id: "car",
            name: "Car",
            kind: "class",
            parent: "vehicle",
            tag: "adds seats",
            detail: "A sibling of Van. Both are Vehicles, but neither is the other — the hierarchy is a tree, not a web.",
          },
          {
            id: "taxi",
            name: "Taxi",
            kind: "final",
            parent: "car",
            tag: "final",
            detail: "Marked final, so nothing may extend it. Useful when a class's behaviour is a guarantee you don't want subclasses quietly altering.",
          },
        ]}
      />

      <h2>super</h2>
      <CodeBlock language="java" filename="calling upwards" code={superKeyword} />
      <p>
        <code>super.method()</code> runs the parent's implementation — invaluable when you want to extend behaviour
        rather than replace it. <code>super(...)</code> in a constructor calls the parent constructor and must be
        the first statement.
      </p>

      <h2>Construction runs from the top down</h2>
      <CodeBlock language="java" filename="constructor chaining" code={chainOrder} />
      <p>
        If you don't write <code>super(...)</code>, the compiler inserts a no-argument <code>super()</code>. Which
        means: if the parent has no no-argument constructor, every subclass constructor <em>must</em> call one of
        the parent's constructors explicitly, or it won't compile.
      </p>

      <AnalogyCard title="Building a house before decorating a room.">
        You can't paint the second floor before the first floor exists. Construction goes bottom-up in the
        building sense — foundations first — which in class terms means the parent's constructor completes before
        the child's body starts. And it's why a parent constructor calling an overridable method is asking the
        decorators to work in a room that hasn't been built.
      </AnalogyCard>

      <h2>Fields are hidden, methods are overridden</h2>
      <OutputPredictor
        code={hidePredictor}
        options={[
          { id: "a", text: "child Child" },
          { id: "b", text: "parent Child" },
          { id: "c", text: "parent Parent" },
          { id: "d", text: "child Parent" },
        ]}
        correctId="b"
        explanation={
          <p>
            Methods are dispatched <strong>dynamically</strong>, using the object's real type — so{" "}
            <code>describe()</code> gives "Child". Fields are resolved <strong>statically</strong>, using the
            reference's declared type — so <code>p.label</code> reads <code>Parent</code>'s copy. Both fields exist
            in the object simultaneously. This is called field hiding, it's almost never intentional, and the fix is
            simply never to redeclare a field that already exists in the parent.
          </p>
        }
      />

      <h2>Preventing inheritance</h2>
      <CodeBlock language="java" filename="final and sealed" code={finalKeyword} />
      <p>
        Designing for inheritance is work: you must document which methods call which, because a subclass can
        override any of them. If you haven't done that work, <code>final</code> is an honest answer.{" "}
        <code>sealed</code> (Java 17) is the middle ground — a fixed, known set of subclasses, which also lets the
        compiler check that a switch covers them all.
      </p>

      <CommonMistake
        title="inheriting to reuse code rather than to express a relationship"
        wrong={`// "A stack is a list with restrictions" — but this leaks everything
public class Stack<E> extends ArrayList<E> {
    public void push(E item) { add(item); }
    public E pop() { return remove(size() - 1); }
}

Stack<String> s = new Stack<>();
s.push("a");
s.add(0, "sneaky");    // inherited — breaks the stack's whole premise`}
        right={`// A stack HAS a list; it is not one
public class Stack<E> {
    private final List<E> items = new ArrayList<>();

    public void push(E item) { items.add(item); }
    public E pop() { return items.remove(items.size() - 1); }
    public boolean isEmpty() { return items.isEmpty(); }
}`}
        explanation={
          <p>
            Inheriting drags in the parent's entire public API, including methods that violate your invariants —
            here, inserting at an arbitrary index. Composition exposes only what you choose. The test:{" "}
            <em>is every operation on the parent meaningful and correct for the child?</em> If not, you want a
            field, not <code>extends</code>. Java's own <code>java.util.Stack</code> made this mistake in 1995 and
            can never fix it.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A subclass starts with everything the parent has and can add more. Use <code>extends</code> when the new
            class genuinely <em>is a kind of</em> the old one. When you create one, the parent's setup runs first,
            then the child's.
          </p>
        }
        developer={
          <p>
            Java has single implementation inheritance — one superclass, but any number of interfaces. Constructors
            aren't inherited and chain upwards via an implicit or explicit <code>super(...)</code>. Methods are
            virtual by default and dispatch on the runtime type via the vtable; fields and static methods do not,
            resolving on the compile-time type instead. <code>protected</code> members become part of the API you
            promise to every subclass, so they deserve the same care as public ones.
          </p>
        }
        interview={
          <p>
            The set piece is overriding versus hiding: instance methods override (dynamic dispatch), while fields
            and static methods hide (static resolution). Also be ready for "why single inheritance?" — to avoid the
            diamond problem for state, since two parents could supply conflicting copies of a field, while
            interfaces contribute no state and so can be multiply implemented safely.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="A parent class has only a constructor that takes an int. What must every subclass constructor do?"
        options={[
          { id: "a", text: "Nothing — the compiler inserts super() automatically" },
          { id: "b", text: "Call super(someInt) explicitly as its first statement" },
          { id: "c", text: "Declare a matching int constructor" },
          { id: "d", text: "Mark itself protected" },
        ]}
        correctId="b"
        explanation="The implicit super() the compiler would insert needs a no-argument parent constructor. If none exists, you must call an available one explicitly, first thing — or chain to another constructor in the same class that does."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Make the diamond of confusion"
        hint={
          <p>
            Declare a field with the same name in both classes, plus a method that returns it in each. Then print
            both the field and the method result through a parent-typed reference.
          </p>
        }
      >
        Build a two-class hierarchy where the child hides a field <em>and</em> overrides a method, then access both
        through a parent-typed reference. Write down which one used the declared type and which used the runtime
        type. That single experiment is the clearest way to remember the difference for good.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Why does Java allow only single inheritance of classes?"
        answer={
          <p>
            Because multiple inheritance of <em>state</em> creates unanswerable questions. If a class inherited from
            two parents that both declared a <code>name</code> field, or both provided <code>save()</code>, the
            language would need rules for which copy an object holds and which implementation runs — the diamond
            problem. C++ answers this with virtual inheritance and considerable complexity; Java chose to sidestep
            it. Interfaces can be implemented in any number because, originally, they carried no state and no
            implementation at all. Default methods (Java 8) reintroduced a limited form of the problem, and Java
            resolves it explicitly: a class inheriting conflicting defaults must override the method, and can
            disambiguate with <code>Interface.super.method()</code>.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "extends means 'is a kind of' — if every parent operation isn't valid on the child, use composition.",
          "Every class implicitly extends Object, which is where toString, equals and hashCode come from.",
          "Construction chains upward: the parent constructor completes before the child's body runs.",
          "Methods are overridden and dispatch on the runtime type; fields and statics are hidden and resolve on the declared type.",
          "final blocks inheritance entirely; sealed permits a fixed, known set of subclasses.",
        ]}
      />
    </>
  )
}
