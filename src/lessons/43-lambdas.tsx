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

const before = `// Java 7: six lines to express "compare by length"
Collections.sort(words, new Comparator<String>() {
    @Override
    public int compare(String a, String b) {
        return Integer.compare(a.length(), b.length());
    }
});

// Java 8: the same thing
words.sort((a, b) -> Integer.compare(a.length(), b.length()));

// ...or, better still
words.sort(Comparator.comparingInt(String::length));`

const syntax = `// Full form
(String a, String b) -> { return a.length() - b.length(); }

// Types inferred from the target type
(a, b) -> { return Integer.compare(a.length(), b.length()); }

// Single expression: braces and return dropped, the value is returned
(a, b) -> Integer.compare(a.length(), b.length())

// Exactly one parameter: parentheses optional
name -> name.toUpperCase()

// No parameters: empty parentheses required
() -> System.currentTimeMillis()

// Multiple statements need braces and an explicit return
order -> {
    log.info("processing {}", order.id());
    return order.total();
}`

const targetTyping = `// The same lambda text means different things depending on
// what type is expected — the "target type".

Runnable task     = () -> System.out.println("hi");    // void run()
Supplier<String>  = () -> "hi";                        // String get()

Predicate<String> isEmpty  = s -> s.isEmpty();         // boolean test(String)
Function<String, Boolean> f = s -> s.isEmpty();        // Boolean apply(String)
// Different types, same body — a lambda has no type of its own.

// This is also why a lambda cannot be assigned to var without help:
// var x = s -> s.isEmpty();     // compile error: no target type`

const methodRefs = `// Four kinds of method reference

// 1. Static method
Function<String, Integer> parse = Integer::parseInt;
//    equivalent to  s -> Integer.parseInt(s)

// 2. Instance method of a PARTICULAR object
Consumer<String> print = System.out::println;
//    equivalent to  s -> System.out.println(s)

// 3. Instance method of an ARBITRARY object of a type
Function<String, String> upper = String::toUpperCase;
//    equivalent to  s -> s.toUpperCase()      — the receiver becomes the argument

// 4. Constructor
Supplier<ArrayList<String>> maker = ArrayList::new;
Function<String, User> factory = User::new;
//    equivalent to  name -> new User(name)`

const capture = `int limit = 10;                        // effectively final: never reassigned
Predicate<Order> big = o -> o.total() > limit;    // captured by value

limit = 20;                            // compile error: 'limit' is not effectively final
                                       // (the error appears on the reassignment)

// Fields have no such restriction, because they live on the heap:
private int threshold = 10;
Predicate<Order> p = o -> o.total() > threshold;   // reads the field each call
threshold = 20;                                    // fine, and the lambda sees it`

const thisPredictor = `public class Scope {
    private String name = "outer";

    Runnable lambda() {
        return () -> System.out.println(name);
    }

    Runnable anonymous() {
        return new Runnable() {
            private String name = "inner";
            @Override public void run() { System.out.println(name); }
        };
    }

    public static void main(String[] args) {
        Scope s = new Scope();
        s.lambda().run();
        s.anonymous().run();
    }
}`

export default function LambdasLesson() {
  return (
    <>
      <p>
        A lambda is a function you can pass around like a value. Java could always do this with anonymous classes,
        but at a verbosity that made people avoid it — and an idea only gets used if it's cheap to express. Lambdas
        made it cheap, and the whole modern half of the standard library followed.
      </p>

      <h2>The difference in practice</h2>
      <CodeBlock language="java" filename="the same behaviour, three ways" code={before} />

      <h2>Syntax</h2>
      <CodeBlock language="java" filename="every form you will see" code={syntax} />

      <AnalogyCard title="Giving someone instructions instead of a finished result.">
        Handing over a sorted list is passing data. Handing over "put these in order by length" is passing a
        <em> method</em> of working — and the recipient decides when and how often to apply it. That's the whole
        idea: a lambda is a small parcel of behaviour that travels like a value.
      </AnalogyCard>

      <h2>A lambda has no type of its own</h2>
      <CodeBlock language="java" filename="target typing" code={targetTyping} />
      <p>
        The lambda gets its type from the context — the parameter type, the variable type, the return type. That's
        why the same text can be a <code>Predicate</code> in one place and a <code>Function</code> in another, and
        why the compiler needs to know what you're assigning it to.
      </p>

      <h2>Method references</h2>
      <CodeBlock language="java" filename="four kinds" code={methodRefs} />
      <Callout variant="tip" title="Use one when the lambda only forwards">
        If your lambda is <code>x -&gt; someMethod(x)</code>, the method reference{" "}
        <code>ClassName::someMethod</code> says the same thing with less to read. If it does anything else — even
        adding a null check — write the lambda; contorting code to fit a method reference is a poor trade.
      </Callout>

      <h2>Capturing variables</h2>
      <CodeBlock language="java" filename="effectively final" code={capture} />
      <p>
        A lambda may use local variables only if they're <strong>effectively final</strong> — assigned once and
        never reassigned. The value is copied into the lambda when it's created, so allowing reassignment would give
        you two copies that silently disagree. Fields have no restriction, because they're read through the object
        reference each time.
      </p>

      <h2>this means something different</h2>
      <OutputPredictor
        code={thisPredictor}
        options={[
          { id: "a", text: "outer\ninner" },
          { id: "b", text: "outer\nouter" },
          { id: "c", text: "inner\ninner" },
          { id: "d", label: "It does not compile", text: "" },
        ]}
        correctId="a"
        explanation={
          <p>
            A lambda introduces no new scope: <code>name</code> and <code>this</code> mean exactly what they mean in
            the enclosing method, so it prints "outer". An anonymous class <em>is</em> a new class with its own{" "}
            <code>this</code>, so its own <code>name</code> field shadows the outer one and it prints "inner". This
            is the most practically important difference between the two — and it's why a lambda can't accidentally
            shadow something.
          </p>
        }
      />

      <CommonMistake
        title="a multi-line lambda where a method belongs"
        wrong={`orders.forEach(order -> {
    if (order.isCancelled()) return;
    var invoice = invoiceFor(order);
    invoice.applyDiscount(discountFor(order.customer()));
    invoice.addTax(taxRateFor(order.address()));
    repository.save(invoice);
    mailer.send(invoice, order.customer().email());
});`}
        right={`orders.stream()
      .filter(order -> !order.isCancelled())
      .forEach(this::invoiceAndNotify);

private void invoiceAndNotify(Order order) {
    var invoice = invoiceFor(order);
    invoice.applyDiscount(discountFor(order.customer()));
    invoice.addTax(taxRateFor(order.address()));
    repository.save(invoice);
    mailer.send(invoice, order.customer().email());
}`}
        explanation={
          <p>
            A long lambda is an unnamed method with a worse stack trace — traces show synthetic names like{" "}
            <code>lambda$process$0</code>, and you can't unit-test it or reuse it. Extract anything beyond a couple
            of lines into a named method and reference it. The pipeline then reads as a summary rather than an
            implementation.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A lambda is a short way of writing a small piece of behaviour so you can pass it to a method. Instead of
            telling a sort "here is a whole class that knows how to compare", you tell it{" "}
            <code>(a, b) -&gt; ...</code>. It can use nearby variables as long as they never change.
          </p>
        }
        developer={
          <p>
            A lambda is an instance of a functional interface, chosen by the target type. It compiles to an{" "}
            <code>invokedynamic</code> call site linked by <code>LambdaMetafactory</code>, not to an anonymous class
            file — non-capturing lambdas can be cached and reused, so they may allocate nothing at all. It captures
            effectively-final locals by value and shares the enclosing <code>this</code>, so it introduces no new
            scope. Checked exceptions cannot escape one unless the target interface declares them.
          </p>
        }
        interview={
          <p>
            Expect: what a functional interface is; why captured locals must be effectively final (the value is
            copied); and how a lambda differs from an anonymous class — no new <code>this</code>, no shadowing, no
            separate class file, and <code>invokedynamic</code> rather than a fresh allocation each time. The four
            kinds of method reference are also a common quick-fire question.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="What does 'this' refer to inside a lambda?"
        options={[
          { id: "a", text: "The lambda object itself" },
          { id: "b", text: "The enclosing instance — a lambda does not introduce a new scope" },
          { id: "c", text: "null, since lambdas are static" },
          { id: "d", text: "It is a compile error to use this in a lambda" },
        ]}
        correctId="b"
        explanation="A lambda is lexically scoped: this, and any name you use, mean exactly what they mean in the surrounding method. An anonymous class is the opposite — it is a real class with its own this, which can shadow the enclosing one and frequently confuses people."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Convert five anonymous classes"
        hint={
          <p>
            Wherever the lambda body is just a call passing its parameter straight through, try a method reference
            instead — and note the one case where it doesn't work.
          </p>
        }
      >
        Take five uses of anonymous classes — a <code>Comparator</code>, a <code>Runnable</code>, a{" "}
        <code>Predicate</code>-shaped filter, a click-handler-style callback, and a factory — and rewrite each as a
        lambda, then as a method reference where possible. Then add a field named the same as a local variable and
        confirm that the anonymous class shadows it while the lambda refuses to compile.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="How does a lambda differ from an anonymous inner class?"
        answer={
          <p>
            Four differences that matter. <strong>Scope</strong>: a lambda doesn't introduce a new scope, so{" "}
            <code>this</code> refers to the enclosing instance and you cannot shadow an enclosing variable; an
            anonymous class has its own <code>this</code> and can shadow freely.{" "}
            <strong>Compilation</strong>: an anonymous class produces a separate class file and a new object at
            every evaluation, whereas a lambda compiles to an <code>invokedynamic</code> instruction linked by{" "}
            <code>LambdaMetafactory</code> — a non-capturing lambda is typically instantiated once and reused, so it
            can allocate nothing. <strong>Applicability</strong>: a lambda requires a functional interface, one
            abstract method; an anonymous class works with any interface or class and can hold state.{" "}
            <strong>Readability</strong>: a lambda is an expression, so it fits on one line. Both capture
            effectively-final locals by value, so that part is the same.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "A lambda implements a functional interface, and its type comes from the context it appears in.",
          "Syntax shortens progressively: drop types, then parentheses for one parameter, then braces and return.",
          "Method references (Type::method, obj::method, Type::new) replace lambdas that only forward.",
          "Captured locals must be effectively final because the value is copied; fields have no such rule.",
          "A lambda shares the enclosing this and introduces no new scope — unlike an anonymous class.",
        ]}
      />
    </>
  )
}
