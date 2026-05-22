import inquirer from "inquirer";

async function run() {
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "selectedOps",
      message: "Select one:",
      choices: [
        { name: "Option 1", value: "opt1" },
        { name: "Option 2", value: "opt2" }
      ]
    }
  ]);
  console.log("Answer type:", typeof answer.selectedOps);
  console.log("Answer value:", answer.selectedOps);
}

run();
