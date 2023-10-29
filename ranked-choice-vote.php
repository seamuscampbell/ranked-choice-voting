<?php
/* Ranked Choice Voting by Seamus Campbell (seamus@seamuscampbell.nyc) with assistance from ChatGPT */

class RankedChoiceVote {
	/*
	Algorithm methodology:
		Put all candidates into a 2-dimensional array with the first dimension being the individual ballot and the second dimension being the order
		After each round, see who has the most votes at the front of their rankings
		If a candidate passes the win number (simple majority), remove them from contention
		If the number of spots for winning candidates is full, stop
		Otherwise, order the rankings and find the candidate with the fewest number of votes BUT if there is a "protected candidate" (e.g. "No Endorsement"), find the candidate with the second-fewest votes
		Remove the found candidate from all of the ballots (i.e. every candidate goes up one rank)
		Continue the process until the number of winners or number of remaining candidates equals the number of maximum winners
	*/

	private $votes = array(); // input multidimensional array of all of the votes (2-dimensional array)
	private $protected_candidate; // if there is a candidate that must be saved round to round, this is where to save it (string)
	private $rounds = 1; // counter for number of rounds it has taken to run (int)
	private $electionName; // name of office being sought (string)
	private $numofWinners; // number of people that can be elected (int)
	private $winnerExists = false; // boolean for if a winner has been found (bool)
	private $winnerName = []; // array storing the name(s) of the winner(s) (1-dimensional array)
	private $numOfSpotsToFill; // number of remaining spots (int)

	// constructor function
	// return: void
	// arguments: array (2 dimensional), string, string, int
	public function __construct($votes, $protected_candidate, $electionName, $numofWinners){ 
        $this->votes = $votes; // input array of the votes
		$this->protected_candidate = $protected_candidate; // candidate that cannot be eliminated between rounds
		$this->electionName = $electionName; // name of the office being sought
		$this->numofWinners = $numofWinners; // number of people who can win
		$this->numOfSpotsToFill = $numofWinners; // number of spots left to fill
    }
	
	// function for telling if there is a winner
	// return: bool
	// arguments: none
	public function getWinnerExists(){
		return $this->winnerExists;
	}
	
	// function to get the office being sought
	// return: string
	// arguments: none
	public function getElectionName(){
		return $this->electionName;
	}
	
	// function to get the number of winners
	// return: int
	// arguments: none
	public function getNumOfWinners(){
		return $this->numofWinners;
	}
	
	// function for outputting winner list
	// return: array
	// arguments: none
	public function getWinner(){
		return $this->winnerName;
	}
	
	// function to output number of winners in the list
	// return: int
	// arguments: none
	public function getNumberOfConfirmedWinners(){
		return sizeof($this->getWinner());
	}
	
	// function for outputting list of all of the candidates
	// return: array
	// arguments: array
	public function getCandidateList($array){
		$uniqueValues = array();
		foreach ($array as $value) {
			if (is_array($value)) {
				// If the element is an array, recursively call the function
				$uniqueValues = array_merge($uniqueValues, getCandidateList($value));
			} elseif (!in_array($value, $uniqueValues)) {
				// If the element is not already in the unique values array, add it
				$uniqueValues[] = $value;
			}
		}
		return $uniqueValues;
	}
	
	// function for number of pople whp voted
	// return: int
	// arguments: none
	private function getNumofBallots(){
		return count($this->votes);
	}
	
	// function to help determine win number
	// return: bool
	// arguments: int
	private function isEven($number){ 
		if($number % 2 == 0){ 
			return true; 
		} 
		else{ 
			return false;
		} 
	}
	
	// function for getting the win number (simple majority)
	// return: int
	// arguments: none
	public function getWinNumber(){
		$numOfBallots = $this->getNumofBallots();
		$winNumber = 0;
		if($this->isEven($numOfBallots)){
			$winNumber = $numOfBallots/2;
			$winNumber++;
		}
		else{
			$numOfBallots++;
			$winNumber = $numOfBallots/2;
		}
		return $winNumber;
	}
	
	// function to search through the first item in each ballot (ballot = 1st dimension of the array) and find the person who got the fewest votes
	// return: string
	// arguments: array (2 dimensional), string
	private function getCandidateWithFewest($array, $skip){
		$votecount = array();
		$firstRow = $this->getFirstItemInEachDimension($array);
		foreach ($firstRow as $candidate) {
			if(!array_key_exists($candidate,$votecount))
			{
				$votecount[$candidate] = 1;
			}
			else{
				$votecount[$candidate]++;
			}
		}
		asort($votecount);
		echo $this->printTally($votecount);
		$votecount = array_reverse($votecount);
		$fewest = array_key_last($votecount);
		if($fewest == $skip){ // if candidate cannot be removed, get next lowest
			$fewest = $this->getKeyOfSecondToLastItem($votecount);
		}
		return $fewest;
	}
	
	// if there is a candidate that cannot be removed, get the candidate with the second fewest number of votes
	// return: string
	// arguments: array (1 dimensional)
	private function getKeyOfSecondToLastItem($array) {
		$keys = array_keys($array);
		if (count($keys) >= 2) {
			$secondToLastKey = $keys[count($keys) - 2];
			return $secondToLastKey;
		} else {
			return null; // Return null if there are fewer than two elements in the array.
		}
	}

	// function for seeing how many votes each person got in that round
	// return: void
	// arguments: array (1 dimensional)
	private function printTally($array){
		$array = array_reverse($array);
		foreach($array as $key => $value) {
			echo $key . ": " . $value . " votes<br />\r\n";
		}
	}
	
	// function to remove the person from the entire array
	// return: void
	// arguments: array (2 dimensional), string
	private function removeCandidate(&$array, $search) {
		foreach ($array as $key => &$value) {
			if (is_array($value)) {
				$this->removeCandidate($value, $search);
			} elseif (is_string($value) && strpos($value, $search) !== false) {
				unset($array[$key]);
			}
		}
		$array = array_values($array);
	}
	
	// function for getting the first item in the first dimension of the array (i.e. the list of candidates from that round)
	// return: array
	// arguments: array (1 dimensional)
	private function getFirstItemInEachDimension($array) {
		$firstItems = array();
		foreach ($array as $subArray) {
			if (is_array($subArray) && count($subArray) > 0) {
				$firstItems[] = reset($subArray);
			}
		}
		return $firstItems;
	}
	
	// function for adding a winner to the winner array
	// return: void
	// arguments: string
	private function addWinner($winner){
		$this->winnerName[] = $winner;
	}
	
	// function to get the list of candidates left (basically the same as getCandidateList() but private)
	// return: array
	// arguments: none
	private function findUniqueVotesLeft(){
		$flattenedArray = array_reduce($this->votes, 'array_merge', []);
		$uniqueItems = array_unique($flattenedArray);
		$uniqueItems = array_values($uniqueItems);
		return $uniqueItems;
	}
	
	// function to get number of candidates left in the race
	// return: int
	// arguments: none
	private function findNumOfUniqueVotesLeft() {
		$uniqueItems = $this->findUniqueVotesLeft();
		$arrayLen = sizeof($uniqueItems);
		return $arrayLen;
	}
	
	// function to get the number of spots left
	// return: int
	// arguments: none
	private function getNumberOfSpotsToFill(){
		return $this->numOfSpotsToFill;
	}
	
	// function to reduce number of spots left by 1
	// return: void
	// arguments: none
	private function reduceNumberOfRemainingSpotsByOne(){
		$this->numOfSpotsToFill--;
	}
	
	// function for if we are in the last round before figuring out who won
	// return: string
	// arguments: array (2 dimensional)
	private function finalCandidatesRound($array){
		$votecount = array();
		$firstRow = $this->getFirstItemInEachDimension($array);
		foreach ($firstRow as $candidate) {
			if(!array_key_exists($candidate,$votecount))
			{
				$votecount[$candidate] = 1;
			}
			else{
				$votecount[$candidate]++;
			}
		}
		asort($votecount);
		$votecount = array_reverse($votecount);
		foreach ($votecount as $key => $value) {
			echo $key . ": " . $value . " votes<br />\r\n";
		}
		$fewest = array_key_last($votecount);
		return $fewest;
	}
	
	// function for determining who got the fewest votes and removing them from all ballots
	// return: void
	// arguments: none
	private function conductRound(){
		$candidateToRemove = $this->getCandidateWithFewest($this->votes,$this->protected_candidate);
		$this->removeCandidate($this->votes, $candidateToRemove);
		echo $candidateToRemove . " was eliminated<br />\r\n\r\n";
	}
	
	// function to increment the number of rounds
	// return: void
	// arguments: none
	private function increaseRound(){
		$this->rounds++;
	}
	
	// function for getting number of candidates that have yet to be eliminated
	// return: int
	// arguments: none
	private function numOfCandidatesLeft(){
		$candidateList = $this->findUniqueVotesLeft();
		return sizeof($candidateList);
	}
	
	// function to see if the top vote-getter is over the threshhold of votes; if so, remove from the list
	// return: array
	// arguments: array (2 dimensional)
	private function seeIfTopVoteGetterIsOverWinNum($array){
		$returnArray = array();
		$votecount = array();
		$firstRow = $this->getFirstItemInEachDimension($array);
		foreach ($firstRow as $candidate) {
			if(!array_key_exists($candidate,$votecount))
			{
				$votecount[$candidate] = 1;
			}
			else{
				$votecount[$candidate]++;
			}
		}
		asort($votecount);
		$votecount = array_reverse($votecount);
		$voteCountOutput = "";
		foreach ($votecount as $key => $value) {
			$voteCountOutput .= $key . ": " . $value . " votes<br />\r\n";
			if($value >= $this->getWinNumber())
			{
				array_push($returnArray,$key);
			}
			
		}
		if(sizeof($returnArray)>0){
			echo $voteCountOutput;
		}
		return $returnArray;
	}
	
	// function for conducting the election
	// return: void
	// arguments: none
	public function conductElection(){
		echo "<h2>" . $this->electionName . "</h2>\r\n";
		echo "<h2>Number of winners: " . $this->getNumOfWinners() . "</h2>\r\n";
		echo "<h2>Win Number: " . $this->getWinNumber() . "</h2>\r\n\r\n";
		while($this->getNumberOfSpotsToFill()>0)
		{
			echo "<h3>Round ". $this->rounds."</h3>\r\n";
			echo "Num of candidates left: " . $this->findNumOfUniqueVotesLeft() . "<br />\r\n";
			$candidateOverThreshold = $this->seeIfTopVoteGetterIsOverWinNum($this->votes);
			// if candidate is over the win number, remove from the list
			if(sizeof($candidateOverThreshold)>0){
				
				for($i=0; $i<sizeof($candidateOverThreshold);$i++){
					$this->addWinner($candidateOverThreshold[$i]);
					$this->removeCandidate($this->votes,$candidateOverThreshold[$i]);
					$this->reduceNumberOfRemainingSpotsByOne();
					echo $candidateOverThreshold[$i] . " has passed the threshhold of ". $this->getWinNumber() . " votes and will be removed from contention<br />\r\n";
					echo "Spots remaining: " . $this->getNumberOfSpotsToFill() . "<br />\r\n\r\n";
				}
			}
			// if we're down to the final candidates, find the one with the higher of the two
			elseif($this->numOfCandidatesLeft()-1 == $this->getNumberOfSpotsToFill()){
				$winner = $this->finalCandidatesRound($this->votes);
				$this->addWinner($winner);
				$this->removeCandidate($this->votes,$winner);
				$this->reduceNumberOfRemainingSpotsByOne();
				echo $winner . " wins last round and is a winner<br />\r\n";
			}
			else{
				$this->conductRound();				
			}
			$this->increaseRound();
		}
		if($this->getNumberOfSpotsToFill() == 0){
			$this->winnerExists = true;
			$winnerList = $this->getWinner();
			if(sizeof($winnerList)==1){
				echo "<p><strong>". $winnerList[0] . " is elected as ". $this->getElectionName() ."</strong></p>";
			}
			else{
				echo "<p><strong>";
				for($x = 0; $x < sizeof($winnerList); $x++){
					if($x == sizeof($winnerList)-1){
						echo $winnerList[$x];
					}
					else{
						echo $winnerList[$x] . ", ";
					}
				}
				echo " are elected as ". $this->getElectionName() ."</strong></p>";
			}
		}
	}
		
}