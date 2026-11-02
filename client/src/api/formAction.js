// Include asynchronous post-save work in the form's busy/error lifecycle.
export async function completeAction(onSubmit, onSaved) {
  const saved = await onSubmit();
  await onSaved?.(saved);
  return saved;
}
