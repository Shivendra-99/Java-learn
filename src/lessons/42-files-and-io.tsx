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

const paths = `import java.nio.file.*;

Path path = Path.of("data", "orders.csv");     // OS-appropriate separator
Path abs  = path.toAbsolutePath();
Path home = Path.of(System.getProperty("user.home"));

path.getFileName()      // orders.csv
path.getParent()        // data
path.resolve("x.txt")   // data/orders.csv/x.txt
path.getParent().resolve("x.txt")   // data/x.txt

Files.exists(path);
Files.size(path);                  // bytes
Files.createDirectories(path.getParent());
Files.delete(path);                // throws if missing
Files.deleteIfExists(path);
Files.copy(src, dest, StandardCopyOption.REPLACE_EXISTING);
Files.move(src, dest);

// java.io.File is the pre-Java-7 API. It signals failure by returning
// false with no explanation. Use java.nio.file for new code.`

const smallFiles = `// Whole-file operations — perfect when the file comfortably fits in memory
String content = Files.readString(path);                    // Java 11+, UTF-8
List<String> lines = Files.readAllLines(path);
byte[] bytes = Files.readAllBytes(path);

Files.writeString(path, content);
Files.write(path, bytes);
Files.writeString(path, "appended\\n", StandardOpenOption.CREATE,
                                       StandardOpenOption.APPEND);`

const streaming = `// Large files: process a line at a time, never holding them all
try (Stream<String> lines = Files.lines(path)) {     // the stream MUST be closed
    long errors = lines.filter(line -> line.contains("ERROR")).count();
}

// Classic reader form, equally valid
try (BufferedReader reader = Files.newBufferedReader(path)) {
    String line;
    while ((line = reader.readLine()) != null) {
        process(line);
    }
}

// Writing
try (BufferedWriter writer = Files.newBufferedWriter(path)) {
    for (Order order : orders) {
        writer.write(order.toCsv());
        writer.newLine();
    }
}`

const streamsVsReaders = `Byte streams              Character streams
------------              -----------------
InputStream               Reader
OutputStream              Writer
raw bytes                 decoded text, charset-aware
images, zips, protocols   .txt, .csv, .json, source code

Bridges:
  new InputStreamReader(in, UTF_8)     bytes  -> characters
  new OutputStreamWriter(out, UTF_8)   characters -> bytes

Decorators wrap to add behaviour:
  new BufferedReader(new InputStreamReader(socket.getInputStream(), UTF_8))
      ^ buffering        ^ decoding            ^ the raw source`

const buffering = `// Unbuffered: one system call per byte. Painfully slow.
try (InputStream in = Files.newInputStream(path)) {
    int b;
    while ((b = in.read()) != -1) { ... }        // thousands of syscalls
}

// Buffered: reads 8KB at a time into memory, serves from there
try (InputStream in = new BufferedInputStream(Files.newInputStream(path))) {
    ...                                          // orders of magnitude faster
}

// Files.newBufferedReader / newBufferedWriter already buffer for you.`

const charset = `// ALWAYS specify the charset, or you inherit the platform default
Files.readString(path);                          // UTF-8 — safe, it is specified
new String(bytes);                               // platform default — a portability bug
new String(bytes, StandardCharsets.UTF_8);       // explicit — correct

new FileReader(file);                            // platform default before Java 18
Files.newBufferedReader(path);                   // UTF-8 by specification

// Since Java 18 the default charset is UTF-8 everywhere, which fixed
// a long-standing source of "works on my machine" bugs. Code that must
// run on older versions should still be explicit.`

export default function FilesAndIoLesson() {
  return (
    <>
      <p>
        Java has three generations of I/O API layered on top of each other, which is why searching for "read a file
        in Java" returns five different answers. The short version: use <code>java.nio.file</code>, use{" "}
        <code>Path</code> rather than <code>File</code>, always close with try-with-resources, and always name your
        charset.
      </p>

      <h2>Paths and files</h2>
      <CodeBlock language="java" filename="java.nio.file" code={paths} />

      <h2>Small files: read it all</h2>
      <CodeBlock language="java" filename="whole-file operations" code={smallFiles} />
      <Callout variant="warning" title="Whole-file methods load the whole file">
        <code>readAllLines</code> on a 4GB log gives you <code>OutOfMemoryError</code>. The rule of thumb: if you
        can't confidently say the file is small, stream it. Note the same applies to the file you're reading{" "}
        <em>today</em> — log files have a way of growing.
      </Callout>

      <h2>Large files: stream it</h2>
      <CodeBlock language="java" filename="a line at a time" code={streaming} />

      <AnalogyCard title="Reading a book versus photographing every page.">
        For a pamphlet, photographing the lot and reading it later is fine. For an encyclopaedia it's absurd — you
        read a page, act on it, and turn over, never holding more than one page. Streaming I/O is reading page by
        page; <code>readAllLines</code> is the camera. And buffering is being handed a chapter at a time rather than
        asking the librarian for each individual word.
      </AnalogyCard>

      <h2>Two families: bytes and characters</h2>
      <CodeBlock language="text" filename="which one do you need?" code={streamsVsReaders} />

      <h2>Buffering</h2>
      <CodeBlock language="java" filename="why it matters so much" code={buffering} />

      <h2>Charsets</h2>
      <CodeBlock language="java" filename="the portability trap" code={charset} />

      <TerminalDemo
        title="What an unspecified charset does"
        prompt="~/io-demo"
        steps={[
          {
            command: "cat > names.txt",
            output: ["Zoë", "Łukasz", "田中", "^D"],
            note: "A UTF-8 file with non-ASCII characters — completely ordinary data for any real application.",
          },
          {
            command: "java -Dfile.encoding=ISO-8859-1 ReadNames.java",
            output: ["ZoÃ«", "Åukasz", "ç°ä¸­"],
            note: "The bytes are fine; the decoding is wrong. Each UTF-8 multi-byte sequence was read as separate Latin-1 characters — the classic mojibake.",
          },
          {
            command: "java ReadNames.java",
            output: ["Zoë", "Łukasz", "田中"],
            note: "Correct on Java 18+, where UTF-8 is the specified default. On earlier versions this depended on the operating system's locale — which is why it worked on the developer's laptop and broke on the server.",
          },
        ]}
      />

      <CommonMistake
        title="not closing a Files.lines stream"
        wrong={`long count = Files.lines(path)
        .filter(line -> line.contains("ERROR"))
        .count();

// The stream holds an open file handle, and nothing closes it.
// Do this in a loop and you exhaust the process's file descriptors:
//   java.nio.file.FileSystemException: Too many open files`}
        right={`try (Stream<String> lines = Files.lines(path)) {
    long count = lines.filter(line -> line.contains("ERROR")).count();
}

// Most streams need no closing — only those backed by an I/O
// resource do: Files.lines, Files.list, Files.walk, Files.find.`}
        explanation={
          <p>
            Almost every stream in Java is fine to leave unclosed, so the ones that aren't catch people out. Any{" "}
            <code>Stream</code> returned by a <code>Files</code> method wraps an open handle and implements{" "}
            <code>AutoCloseable</code> for exactly that reason. The failure is delayed and looks unrelated — file
            descriptor exhaustion elsewhere in the program.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Use <code>Path</code> to name a file and <code>Files</code> to work with it. For small files, read the
            whole thing in one call. For big ones, read a line at a time so you never hold it all in memory. Always
            open files inside <code>try (...)</code> so they get closed.
          </p>
        }
        developer={
          <p>
            <code>java.nio.file</code> replaced <code>java.io.File</code>, which reported failures as a{" "}
            <code>false</code> return with no reason. Byte streams (<code>InputStream</code>/
            <code>OutputStream</code>) and character streams (<code>Reader</code>/<code>Writer</code>) are bridged
            by <code>InputStreamReader</code>/<code>OutputStreamWriter</code> and composed via decorators.
            Buffering matters because an unbuffered read is a system call per byte. Streams returned by{" "}
            <code>Files.lines</code>, <code>list</code>, <code>walk</code> and <code>find</code> hold file handles
            and must be closed.
          </p>
        }
        interview={
          <p>
            Likely questions: <code>File</code> versus <code>Path</code>; byte streams versus character streams and
            when you need each; why <code>BufferedReader</code> is faster than <code>FileReader</code> alone; and
            how to process a file too large for memory. A strong extra is the charset point — that an unspecified
            charset was one of Java's most persistent portability bugs until UTF-8 became the default in Java 18.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="You need to count matching lines in a 10GB log file. Which approach?"
        options={[
          { id: "a", text: "Files.readAllLines, then filter the list" },
          { id: "b", text: "Files.lines inside try-with-resources, filtering as it streams" },
          { id: "c", text: "Files.readString and split on newlines" },
          { id: "d", text: "Files.readAllBytes and scan the array" },
        ]}
        correctId="b"
        explanation="Only the streaming approach avoids loading the file into memory — it processes one line at a time and discards it. The other three all materialise the entire 10GB and fail with OutOfMemoryError. The try-with-resources matters too: Files.lines holds an open file handle."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Break it with size, then fix it"
        hint={
          <p>
            Generate the file with <code>Files.newBufferedWriter</code> in a loop. Run the reader with{" "}
            <code>-Xmx64m</code> to make the failure quick.
          </p>
        }
      >
        Write a program that generates a large text file, then read it two ways — <code>readAllLines</code> and{" "}
        <code>Files.lines</code> — under a small heap. Confirm one fails and one doesn't. Then time an unbuffered
        byte-at-a-time read against a buffered one on the same file and note the ratio; it's usually large enough to
        be memorable.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the difference between byte streams and character streams, and why does buffering matter?"
        answer={
          <p>
            Byte streams — <code>InputStream</code> and <code>OutputStream</code> — move raw bytes and are what you
            want for images, archives, and binary protocols. Character streams — <code>Reader</code> and{" "}
            <code>Writer</code> — move decoded text, which means a charset is involved: they know that a multi-byte
            UTF-8 sequence is one character. <code>InputStreamReader</code> and <code>OutputStreamWriter</code> are
            the bridges between the two, and that's where you specify the charset. Buffering matters because an
            unbuffered read asks the operating system for one byte at a time, and a system call costs vastly more
            than a memory read; a <code>BufferedReader</code> pulls 8KB into memory and serves subsequent reads from
            there, which is typically orders of magnitude faster. It also enables convenience methods like{" "}
            <code>readLine()</code>, which need lookahead. In modern code, <code>Files.newBufferedReader</code>{" "}
            gives you the decoding, the buffering, and a specified UTF-8 charset in one call.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Use java.nio.file — Path and Files — rather than the legacy java.io.File.",
          "Read whole files only when you're sure they're small; stream anything that could grow.",
          "Byte streams for binary, character streams for text, with explicit charsets at the bridge.",
          "Buffer, or pay a system call per byte.",
          "Streams from Files.lines / list / walk hold file handles and must be closed.",
        ]}
      />
    </>
  )
}
