<script lang="ts">
  let { text }: { text: string } = $props();
</script>

<input type="text" bind:value={text} disabled />

<input type="button" value="Save" />
