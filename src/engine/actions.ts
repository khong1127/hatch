import { uuid } from "./util.ts";
export interface ActionRecord {
  id?: string;
  // deno-lint-ignore ban-types
  action: Function;
  concept: object;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  synced?: Map<string, string>;
  flow: string;
}
export class ActionConcept {
  actions: Map<string, ActionRecord> = new Map();
  flowIndex: Map<string, ActionRecord[]> = new Map();
  invoke(record: ActionRecord) {
    let id = record.id;
    const flow = record.flow;
    if (id === undefined) {
      id = uuid();
    }
    const actionRecord = { id, ...record };
    this.actions.set(id, actionRecord);
    const partition = this.flowIndex.get(flow) || [];
    this.flowIndex.set(flow, [...partition, actionRecord]);
    // Temporary debug: log action invocation for tracing
    try {
      const conceptName =
        (((actionRecord.concept as unknown) as {
          constructor?: { name?: string };
        })
          .constructor?.name) || "<unknown>";
      const actionName =
        (((actionRecord.action as unknown) as { name?: string }).name) ||
        "<anonymous>";
      console.log(
        `Action.invoke -> ${conceptName}.${actionName} id=${actionRecord.id} flow=${flow}`,
      );
    } catch {
      // ignore logging errors
    }
    return { id };
  }
  invoked({ id, output }: { id: string; output: Record<string, unknown> }) {
    const action = this.actions.get(id);
    if (action === undefined) {
      throw new Error(`Action with id ${id} not found.`);
    }
    action.output = output;
    // Temporary debug: log action completion for tracing
    try {
      const conceptName =
        (((action.concept as unknown) as { constructor?: { name?: string } })
          .constructor?.name) || "<unknown>";
      const actionName =
        (((action.action as unknown) as { name?: string }).name) ||
        "<anonymous>";
      console.log(
        `Action.invoked <- ${conceptName}.${actionName} id=${id} output=${
          JSON.stringify(output)
        }`,
      );
    } catch {
      // ignore logging errors
    }
    return { id };
  }
  _getByFlow(flow: string) {
    return this.flowIndex.get(flow);
  }
  _getById(id: string) {
    return this.actions.get(id);
  }
}
