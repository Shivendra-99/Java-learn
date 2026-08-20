import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"
import { StepFlowDiagram } from "@/components/diagram/step-flow-diagram"
import { Package, Truck, Calculator, CircleDollarSign, CircleCheck } from "lucide-react"

const problem = `// The problem: an algorithm hard-coded with a switch that keeps growing
double shippingCost(Order order, String method) {
    switch (method) {
        case "standard": return order.weight() * 1.5;
        case "express":  return order.weight() * 3.0 + 5;
        case "drone":    return 12.0;
        // every new method edits THIS method — and every other one
        // that also switches on shipping method
    }
}

// Strategy (behavioural): make each algorithm an object, chosen at
// runtime, so the code using it never changes when algorithms do.`

const classic = `// The strategy: an interface with one operation
interface ShippingStrategy {
    double cost(Order order);
}

class StandardShipping implements ShippingStrategy {
    public double cost(Order o) { return o.weight() * 1.5; }
}
class ExpressShipping implements ShippingStrategy {
    public double cost(Order o) { return o.weight() * 3.0 + 5; }
}

// The context holds a strategy and delegates to it
class Checkout {
    private ShippingStrategy shipping;
    public void setShipping(ShippingStrategy s) { this.shipping = s; }

    public double total(Order order) {
        return order.subtotal() + shipping.cost(order);   // delegates
    }
}

Checkout checkout = new Checkout();
checkout.setShipping(new ExpressShipping());   // swap at runtime
checkout.total(order);`

const lambda = `// Strategy IS a functional interface, so a lambda is a strategy
interface ShippingStrategy {
    double cost(Order order);
}

Map<String, ShippingStrategy> strategies = Map.of(
    "standard", o -> o.weight() * 1.5,
    "express",  o -> o.weight() * 3.0 + 5,
    "drone",    o -> 12.0
);

double cost = strategies.get(method).cost(order);

// Or just use the built-in functional types — no custom interface at all:
Function<Order, Double> standard = o -> o.weight() * 1.5;
ToDoubleFunction<Order> express = o -> o.weight() * 3.0 + 5;`

const jdk = `// Strategy is everywhere in the JDK, usually as a functional interface

// Comparator IS a strategy for ordering
list.sort(Comparator.comparing(Employee::getName));   // pass the algorithm in
list.sort((a, b) -> b.getSalary() - a.getSalary());   // ...or a different one

// A Predicate is a strategy for 'keep or drop'
stream.filter(order -> order.total() > 100);

// A ThreadFactory, a RejectionPolicy, a Collector — all strategies you plug in.`

export default function StrategyPatternLesson() {
  return (
    <>
      <p>
        Strategy lets you select an algorithm at runtime by passing it in as an object. It's the pattern that most
        directly expresses "program to an interface", and in modern Java it often collapses to a single lambda —{" "}
        <code>Comparator</code> is a strategy, and you've been using it for lessons.
      </p>

      <CodeBlock language="text" filename="the problem" code={problem} />

      <h2>The classic form</h2>
      <CodeBlock language="java" filename="strategy as an interface" code={classic} />
      <p>
        The <strong>context</strong> (<code>Checkout</code>) holds a reference to a <strong>strategy</strong>{" "}
        interface and delegates the varying step to it. Callers inject whichever concrete strategy they want, and
        can change it at runtime. Adding a new shipping method means adding a class — the <code>Checkout</code> code
        never changes.
      </p>

      <h2>How a request flows</h2>
      <StepFlowDiagram
        title="checkout.total(order) with a strategy plugged in"
        steps={[
          {
            id: "inject",
            label: "Inject the strategy",
            detail: "The context is given a concrete strategy — ExpressShipping — via a setter or constructor. It knows only the interface type.",
            icon: Package,
          },
          {
            id: "call",
            label: "Context does its work",
            detail: "total() computes the parts it owns — the subtotal — and reaches the step that varies: the shipping cost.",
            icon: Calculator,
          },
          {
            id: "delegate",
            label: "Delegate to the strategy",
            detail: "Instead of a switch, it calls shipping.cost(order). The context has no idea which algorithm runs — dynamic dispatch picks it.",
            icon: Truck,
            tone: "warning",
          },
          {
            id: "result",
            label: "Strategy returns its answer",
            detail: "ExpressShipping.cost runs and returns. Swapping in DroneShipping changes the result with no change to total().",
            icon: CircleDollarSign,
          },
          {
            id: "extend",
            label: "Add a method = add a class",
            detail: "A new strategy is a new class implementing the interface. Nothing that uses the context is touched — the open/closed principle in action.",
            icon: CircleCheck,
            tone: "success",
          },
        ]}
      />

      <h2>Strategy is a lambda now</h2>
      <CodeBlock language="java" filename="the modern form" code={lambda} />
      <Callout variant="info" title="A functional interface is a strategy">
        The classic Strategy diagram — an interface with one method and several implementing classes — is exactly a
        functional interface with several lambdas. That's why so much of the Stream and Comparator API is Strategy
        wearing a different name. If your strategy has one method and no state, a lambda or a{" "}
        <code>java.util.function</code> type is usually all you need.
      </Callout>

      <h2>Where the JDK uses it</h2>
      <CodeBlock language="java" filename="Comparator, Predicate, and friends" code={jdk} />

      <AnalogyCard title="Choosing a route in a sat-nav.">
        Fastest, shortest, no motorways, avoid tolls — same journey, same destination, a different algorithm for
        picking the roads. You switch strategy and the navigation carries on identically; it doesn't need rewriting
        to understand a new preference. Strategy is that dropdown: the surrounding system stays put while the
        pluggable decision changes.
      </AnalogyCard>

      <CommonMistake
        title="a strategy interface with exactly one implementation, forever"
        wrong={`interface TaxStrategy { long tax(long amount); }

class StandardTax implements TaxStrategy {
    public long tax(long amount) { return amount / 5; }
}

// One implementation, no runtime choice, no plans for another.
// You've added an interface and a class to call one method.`}
        right={`// If there's genuinely one algorithm, just write it
long tax(long amount) { return amount / 5; }

// Introduce the strategy WHEN a second algorithm appears, or when
// callers actually need to choose — not speculatively.`}
        explanation={
          <p>
            Strategy earns its keep when the algorithm genuinely varies — multiple implementations, or a choice made
            at runtime. A strategy interface with one permanent implementation is speculative generality: indirection
            paying for flexibility nobody uses. Add the pattern when the second algorithm arrives, which is a
            five-minute refactor, rather than building the framework for algorithms that may never exist.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Strategy means passing in <em>how</em> to do something as an object, so you can swap it out. A sort that
            takes a <code>Comparator</code> is doing this: you hand it the comparison rule, and you can hand it a
            different one without changing the sort. Any behaviour you can pass as a lambda is a strategy.
          </p>
        }
        developer={
          <p>
            A context delegates a varying operation to a strategy interface it holds by reference, chosen at
            runtime. It favours composition over inheritance for behaviour and satisfies open/closed: new algorithms
            are new classes, and the context is untouched. In modern Java the interface is usually functional, so
            strategies are lambdas or method references, often stored in a <code>Map</code> keyed by name to replace
            a switch. <code>Comparator</code>, <code>Predicate</code> and <code>Collector</code> are the JDK's
            strategies.
          </p>
        }
        interview={
          <p>
            Two classics. First, "Strategy versus State" — structurally near-identical, but Strategy is chosen by
            the client and the strategies are independent, whereas State is chosen internally and states transition
            between themselves. Second, how lambdas changed it: a single-method strategy is now a lambda, and a
            registry of strategies is a <code>Map&lt;Key, LambdaType&gt;</code>. Naming <code>Comparator</code> as
            Strategy shows you see the pattern in code you already write.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Which JDK type is the clearest example of the Strategy pattern?"
        options={[
          { id: "a", text: "StringBuilder" },
          { id: "b", text: "Comparator, passed to a sort to select the ordering algorithm" },
          { id: "c", text: "ArrayList" },
          { id: "d", text: "Optional" },
        ]}
        correctId="b"
        explanation="A Comparator is a pluggable algorithm for ordering — you pass a different one to change how a sort behaves, without touching the sort itself. That's Strategy exactly. StringBuilder is Builder; the others aren't strategies."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Turn a switch into a strategy map"
        hint={
          <p>
            A <code>Map&lt;String, ShippingStrategy&gt;</code> with lambdas as the values replaces the switch, and{" "}
            <code>getOrDefault</code> handles the unknown case.
          </p>
        }
      >
        Find a method that switches over a string or enum to run different calculations, and replace it with a{" "}
        <code>Map</code> from the key to a lambda strategy. Add a new case by putting one entry in the map, and
        confirm the calling code didn't change. Then decide whether the classic interface-plus-classes version would
        have read any better — usually, for one-method strategies, it wouldn't.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the difference between the Strategy and State patterns?"
        answer={
          <p>
            Structurally they look almost identical — a context delegates to an interface with interchangeable
            implementations — but the intent differs. <strong>Strategy</strong> is about choosing an{" "}
            <em>algorithm</em>: the client picks which strategy the context uses, the strategies are independent and
            unaware of each other, and the choice typically doesn't change on its own. A <code>Comparator</code> is
            the model. <strong>State</strong> is about an object's <em>behaviour changing with its internal
            condition</em>: the states are chosen internally rather than by the client, and crucially the states
            transition <em>between themselves</em> — a <code>DraftOrder</code> state moves the order to a{" "}
            <code>SubmittedOrder</code> state, which the context wouldn't do with strategies. So: same shape,
            different questions. Strategy asks "which algorithm should I use?"; State asks "how should I behave given
            what I currently am, and what should I become next?". In modern Java a stateless Strategy is usually
            just a lambda, whereas State's transition logic and per-state data keep it as full classes.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Strategy makes an algorithm an object chosen at runtime, so the code using it never changes when algorithms do.",
          "A context holds a strategy interface and delegates the varying step to it.",
          "Adding an algorithm means adding a class (or a lambda) — the open/closed principle.",
          "A single-method strategy is a functional interface, so in modern Java it's often just a lambda.",
          "Comparator, Predicate and Collector are the JDK's strategies; State looks the same but transitions internally.",
        ]}
      />
    </>
  )
}
