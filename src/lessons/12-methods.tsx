import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { MemoryDiagram } from "@/components/diagram/memory-diagram"
import { OutputPredictor } from "@/components/lesson/output-predictor"
import { Quiz } from "@/components/lesson/quiz"

const anatomy = `public    static  double  average(int[] values)  throws IllegalArgumentException {
//  ^         ^        ^        ^        ^                    ^
// access   binding  return   name   parameter list      checked exceptions
//                    type
    if (values.length == 0) {
        throw new IllegalArgumentException("no values");
    }
    int total = 0;
    for (int value : values) {
        total += value;
    }
    return (double) total / values.length;
}`

const overloading = `// Same name, different parameter lists — this is overloading
void log(String message)                  { ... }
void log(String message, Throwable cause) { ... }
void log(int code)                        { ... }

// NOT overloading — the return type is not part of the signature
int  parse(String s) { ... }
long parse(String s) { ... }   // compile error: already defined

// The compiler picks at COMPILE time, using the declared types
Object o = "hello";
log(o);        // no log(Object) overload -> compile error, even though o holds a String`

const varargs = `// Zero or more ints, seen inside the method as an int[]
static int sum(int... numbers) {
    int total = 0;
    for (int n : numbers) total += n;
    return total;
}

sum()             // 0
sum(1)            // 1
sum(1, 2, 3)      // 6
sum(new int[]{1, 2, 3})   // 6 — an array works too

// Only one varargs parameter, and it must come last
static void log(String format, Object... args) { ... }`

const recursion = `static long factorial(int n) {
    if (n <= 1) return 1;          // base case — stops the recursion
    return n * factorial(n - 1);   // recursive case — moves towards the base
}

// factorial(4)
//   -> 4 * factorial(3)
//        -> 3 * factorial(2)
//             -> 2 * factorial(1)
//                  -> 1            base case reached
//             = 2
//        = 6
//   = 24`

const overloadPredictor = `public class Pick {
    static void show(int value)    { System.out.println("int"); }
    static void show(long value)   { System.out.println("long"); }
    static void show(Integer value){ System.out.println("Integer"); }
    static void show(Object value) { System.out.println("Object"); }

    public static void main(String[] args) {
        short s = 5;
        show(s);
    }
}`

export default function MethodsLesson() {
  return (
    <>
      <p>
        A method is a named block of code with a declared input and output. That much is obvious. What's worth
        studying is the <strong>signature</strong> — the name plus the parameter types — because it's what the
        compiler uses to decide which method you meant, and the rules for that decision surprise people.
      </p>

      <h2>Anatomy</h2>
      <CodeBlock language="java" filename="a method, labelled" code={anatomy} />
      <p>
        The <strong>signature</strong> is only the name and the parameter types. Not the return type, not the access
        modifier, not the exceptions. That single fact explains most of what follows.
      </p>

      <h2>Overloading: the same name, different parameters</h2>
      <CodeBlock language="java" filename="overloading" code={overloading} />
      <p>
        Overload resolution happens at <em>compile</em> time, based on the <em>declared</em> types of the arguments.
        That's the opposite of overriding, which happens at runtime based on the actual object — the distinction
        gets a lesson of its own later, and interviewers love the contrast.
      </p>

      <OutputPredictor
        question="Which overload gets called?"
        code={overloadPredictor}
        options={[
          { id: "a", text: "int" },
          { id: "b", text: "long" },
          { id: "c", text: "Integer" },
          { id: "d", text: "Object" },
        ]}
        correctId="a"
        explanation={
          <p>
            The compiler tries three phases in order. <strong>Phase 1</strong>: widening primitive conversion only —{" "}
            <code>short</code> widens to <code>int</code>, which matches, so it stops there and never considers
            boxing. Only if no widening match existed would it try <strong>phase 2</strong> (autoboxing, giving{" "}
            <code>Integer</code>) and then <strong>phase 3</strong> (varargs). The rule to remember: widening beats
            boxing, and boxing beats varargs.
          </p>
        }
      />

      <h2>Varargs</h2>
      <CodeBlock language="java" filename="variable arity" code={varargs} />
      <p>
        Inside the method, a varargs parameter <em>is</em> an array — the compiler builds one at each call site. It
        must be the last parameter, and there can only be one. It's the mechanism behind{" "}
        <code>String.format</code>, <code>List.of</code>, and most logging APIs.
      </p>

      <h2>Each call gets its own stack frame</h2>
      <p>
        Calling a method pushes a frame holding that call's parameters and local variables. Returning pops it. This
        is why two calls to the same method never interfere with each other, and why recursion works at all.
      </p>
      <MemoryDiagram
        title="Calling into a method and back out"
        steps={[
          {
            label: "main() starts",
            detail: "One frame, holding main's locals. The array lives on the heap; values holds a reference to it.",
            stack: [{ id: "main", label: "main()", vars: [{ name: "values", ref: "arr@1" }] }],
            heap: [{ id: "arr@1", type: "int[3]", fields: [["[0]", "4"], ["[1]", "8"], ["[2]", "6"]] }],
          },
          {
            label: "main calls average(values)",
            detail: "A new frame is pushed. The parameter is a copy of the reference — a second arrow to the same array, not a second array.",
            stack: [
              { id: "main", label: "main()", vars: [{ name: "values", ref: "arr@1" }] },
              { id: "avg", label: "average(int[])", vars: [{ name: "values", ref: "arr@1" }, { name: "total", value: "0" }] },
            ],
            heap: [{ id: "arr@1", type: "int[3]", fields: [["[0]", "4"], ["[1]", "8"], ["[2]", "6"]] }],
          },
          {
            label: "the loop runs",
            detail: "total accumulates inside average's frame only. main cannot see it, and it disappears when the method returns.",
            stack: [
              { id: "main", label: "main()", vars: [{ name: "values", ref: "arr@1" }] },
              { id: "avg", label: "average(int[])", vars: [{ name: "values", ref: "arr@1" }, { name: "total", value: "18" }] },
            ],
            heap: [{ id: "arr@1", type: "int[3]", fields: [["[0]", "4"], ["[1]", "8"], ["[2]", "6"]] }],
          },
          {
            label: "average returns 6.0",
            detail: "The frame is popped and every local in it is gone. Only the returned value crosses back — which is why a method cannot reassign a caller's variable.",
            stack: [{ id: "main", label: "main()", vars: [{ name: "values", ref: "arr@1" }, { name: "mean", value: "6.0" }] }],
            heap: [{ id: "arr@1", type: "int[3]", fields: [["[0]", "4"], ["[1]", "8"], ["[2]", "6"]] }],
          },
        ]}
      />

      <h2>Recursion</h2>
      <CodeBlock language="java" filename="factorial" code={recursion} />
      <p>
        Every recursive method needs a <strong>base case</strong> that returns without recursing, and every
        recursive call must move towards it. Miss either and you get <code>StackOverflowError</code> — each call
        consumes a frame, and the stack is typically only a few hundred kilobytes.
      </p>
      <Callout variant="info" title="Java does not optimise tail calls">
        Some languages turn a recursive call in tail position into a loop, so recursion depth costs nothing. The JVM
        doesn't, mainly because stack frames are needed for the security and stack-trace model. So in Java, deep
        recursion over a large data set is a real risk — convert it to a loop or an explicit stack.
      </Callout>

      <AnalogyCard title="A stack of forms on a desk.">
        Each method call puts a fresh form on top of the pile, with its own blanks to fill in. You can only ever
        write on the top form. Finishing it means handing one number back to the form beneath and throwing yours
        away. Recursion is putting a copy of the same form on the pile — fine, until the pile hits the ceiling.
      </AnalogyCard>

      <h2>Naming methods well</h2>
      <ul>
        <li>
          <strong>Verbs for actions</strong>: <code>calculateTotal</code>, <code>sendInvoice</code>,{" "}
          <code>parseDate</code>.
        </li>
        <li>
          <strong>is / has for booleans</strong>: <code>isActive</code>, <code>hasPermission</code> — so the call
          site reads as a sentence.
        </li>
        <li>
          <strong>Say what, not how</strong>: <code>findCustomer</code> survives switching from a list to a
          database; <code>loopThroughCustomerList</code> doesn't.
        </li>
        <li>
          <strong>One job per method</strong>. If the name needs an "And" in it, it's two methods.
        </li>
      </ul>

      <CommonMistake
        title="overloading where two distinct names would be clearer"
        wrong={`// What does this do? Depends which overload — and the caller can't tell.
process(order);
process(order, true);
process(order, true, false);`}
        right={`processImmediately(order);
processWithRetry(order);
processInBackground(order);

// Or take a parameter object when there are genuinely many options
process(order, ProcessOptions.builder().retry(true).build());`}
        explanation={
          <p>
            Overloading is at its best when the overloads do the <em>same</em> thing to different types —{" "}
            <code>println(int)</code> and <code>println(String)</code>. It's at its worst when boolean parameters
            select between different behaviours, because the call site becomes unreadable and adding a third option
            makes it worse. Distinct names cost nothing and document themselves.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A method is a reusable block with inputs and one output. Two methods can share a name as long as they
            take different kinds of input — the compiler works out which one you meant from what you pass. Each call
            gets its own private copy of its variables, so calls never tread on each other.
          </p>
        }
        developer={
          <p>
            The signature is the name plus the parameter types; the return type is excluded, which is why you can't
            overload on it alone. Resolution runs in three phases — strict (widening only), then loose (autoboxing),
            then varargs — and stops at the first phase that finds an applicable method, preferring the most
            specific one. Each invocation pushes a frame holding locals and the operand stack;{" "}
            <code>-Xss</code> controls the size, and exceeding it throws <code>StackOverflowError</code>.
          </p>
        }
        interview={
          <p>
            Two dependable questions. "Can you overload on return type?" — no, because the signature excludes it and
            a call whose result is discarded would be ambiguous. "What happens when an overload matches by both
            widening and boxing?" — widening wins, since phase 1 completes before boxing is considered. Adding that
            resolution is static (compile time) while overriding is dynamic (runtime) usually earns the follow-up
            question for free.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Which of these pairs is NOT valid overloading?"
        options={[
          { id: "a", text: "void save(User u) and void save(Order o)" },
          { id: "b", text: "int find(String s) and long find(String s)" },
          { id: "c", text: "void log(String m) and void log(String m, Throwable t)" },
          { id: "d", text: "void add(int a, double b) and void add(double a, int b)" },
        ]}
        correctId="b"
        explanation="Overloads must differ in parameter types. The return type is not part of the signature, so two methods taking the same String parameter clash regardless of what they return. Option d is legal — the parameter types differ in order, which is enough."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Find your stack depth"
        hint={
          <p>
            Write a method that increments a counter and calls itself, catching{" "}
            <code>StackOverflowError</code> in <code>main</code> and printing the counter.
          </p>
        }
      >
        Measure how deep recursion can go on your JVM before it overflows. Then run again with{" "}
        <code>java -Xss1m</code> and compare. Finally, rewrite the same computation as a loop and confirm it handles
        an input a hundred times larger — that's the practical reason to prefer iteration for deep structures in
        Java.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Can two methods differ only by return type? Why or why not?"
        answer={
          <p>
            No. A method's signature in Java is its name and its parameter types; the return type is deliberately
            excluded. If it were included, a call like <code>parse("5");</code> that discards the result would be
            ambiguous — there'd be no information available to choose between an <code>int</code> version and a{" "}
            <code>long</code> version. Note the JVM itself <em>does</em> include the return type in a method
            descriptor, which is how bridge methods generated for generics can coexist with the methods they
            forward to. But at the language level, differing only by return type is a compile error.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "The signature is the name plus parameter types — the return type is not part of it.",
          "Overload resolution is a compile-time decision based on declared types: widening beats boxing beats varargs.",
          "A varargs parameter is an array inside the method, must be last, and there can be only one.",
          "Every call pushes a stack frame; locals are private to that call and vanish when it returns.",
          "Recursion needs a base case, and Java has no tail-call optimisation — deep recursion overflows.",
        ]}
      />
    </>
  )
}
