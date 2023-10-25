<?php
/* Ranked Choice Voting by Seamus Campbell (seamus@seamuscampbell.nyc) */

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
	
	private $votes = array(); // input multidimensional array of all of the votes
	private $protected_candidate; // if there is a candidate that must be saved round to round, this is where to save it
	private $rounds = 1; // counter for number of rounds it has taken to run
	private $electionName; // name of office being sought
	private $numofWinners; // number of people that can be elected
	private $winnerExists = false; // boolean for if a winner has been found
	private $winnerName = []; // array storing the name(s) of the winner(s)

	// constructor function
	// return: void
	public function __construct($votes, $protected_candidate, $electionName, $numofWinners){ 
        $this->votes = $votes; // input array of the votes
		$this->protected_candidate = $protected_candidate; // candidate that 
		$this->electionName = $electionName;
		$this->numofWinners = $numofWinners;
    }
	
	// function for telling if there is a winner
	// return: bool
	public function getWinnerExists(){
		return $this->winnerExists;
	}
	
	// function to get the office being sought
	// return: string
	public function getElectionName(){
		return $this->electionName;
	}
	
	// function to get the number of winners
	// return: int
	public function getNumOfWinners(){
		return $this->numofWinners;
	}
	
	// function for outputting winner list
	// return: array
	public function getWinner(){
		return $this->winnerName;
	}
	
	// function to output number of winners in the list
	// return: int
	public function getNumberOfConfirmedWinners(){
		return sizeof($this->getWinner());
	}
	
	// function for outputting list of all of the candidates
	// return: array
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
	private function getNumofBallots(){
		return count($this->votes);
	}
	
	// function to help determine win number
	// return: bool
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
	private function printTally($array){
		$array = array_reverse($array);
		foreach($array as $key => $value) {
			echo $key . ": " . $value . " votes<br />\r\n";
		}
	}
	
	// function to remove the person who got the fewest votes from the entire array
	// return: void
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
	private function addWinner($winner){
		$this->winnerName[] = $winner;
	}
	
	// function to get the list of candidates left (basically the same as getCandidateList() but private)
	// return: array
	private function findUniqueVotesLeft(){
		$flattenedArray = array_reduce($this->votes, 'array_merge', []);
		$uniqueItems = array_unique($flattenedArray);
		$uniqueItems = array_values($uniqueItems);
		return $uniqueItems;
	}
	
	// function to get number of candidates left in the race
	// return: int
	private function findNumOfUniqueVotesLeft() {
		$uniqueItems = $this->findUniqueVotesLeft();
		$arrayLen = sizeof($uniqueItems);
		return $arrayLen;
	}
	
	// function for if we are in the last round before figuring out who won
	// return: string
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
	private function conductRound(){
		$candidateToRemove = $this->getCandidateWithFewest($this->votes,$this->protected_candidate);
		$this->removeCandidate($this->votes, $candidateToRemove);
		echo $candidateToRemove . " was eliminated<br />\r\n\r\n";
	}
	
	// function for inputting the remaining candidates (i.e. the winners) into the winners list
	// return: void
	private function finalRound(){
		$winner = $this->findUniqueVotesLeft();
		for($i=0;$i<sizeof($winner); $i++){
			$this->addWinner($winner[$i]);
		}
		$this->winnerExists = true;
	}
	
	// function to increment the number of rounds
	// return: void;
	private function increaseRound(){
		$this->rounds++;
	}
	
	// function for getting number of candidates that have yet to be eliminated
	// return: int
	private function numOfCandidatesLeft(){
		$candidateList = $this->findUniqueVotesLeft();
		return sizeof($candidateList);
	}
	
	// function for printing the tally for the last round
	// return: void
	private function printTallyLastRound($array){
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
	}
	
	// function to see if the top vote-getter is over the threshhold of votes; if so, remove from the list
	// return: bool
	private function seeIfTopVoteGetterIsOverWinNum($array){
		$returnVal = false;
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
		$outputString = "";
		$voteCountOutput = "";
		foreach ($votecount as $key => $value) {
			$voteCountOutput .= $key . ": " . $value . " votes<br />\r\n";
			if($value >= $this->getWinNumber())
			{
				$this->addWinner($key);
				$this->removeCandidate($this->votes, $key);
				$outputString .= $key . " has passed the threshhold of ". $this->getWinNumber() . " votes and will be removed from contention<br />\r\n\r\n";
				$returnVal = true;
			}
			
		}
		if($returnVal){
			echo $voteCountOutput;
		}
		echo $outputString;
		return $returnVal;
	}
	
	// function to know if all of the winner spots are occupied (i.e. if we have to keep going)
	// return: bool
	private function haveAllAvailibleSpotsBeenFilled(){
		$returnVal = false;
		if($this->getNumOfWinners() == $this->getNumberOfConfirmedWinners())
			{
				$returnVal = true;
				$this->winnerExists = true;
			}	
	}
	
	// function for conducting the election
	// return: void
	public function conductElection(){
		echo "<h2>" . $this->electionName . "</h2>\r\n";
		echo "<h2>Number of winners: " . $this->getNumOfWinners() . "</h2>\r\n\r\n";
		echo "<h2>Win Number: " . $this->getWinNumber() . "</h2>\r\n\r\n";
		
		while($this->haveAllAvailibleSpotsBeenFilled()==false)
		{
			if($this->findNumOfUniqueVotesLeft()-1 == $this->getNumOfWinners()){
				echo "<h3>Round ". $this->rounds."</h3>\r\n";
				echo "Num of candidates left: " . $this->findNumOfUniqueVotesLeft() . "\r\n";
				$candidateToRemove = $this->finalCandidatesRound($this->votes);
				$this->removeCandidate($this->votes, $candidateToRemove);
				echo $candidateToRemove . " was eliminated<br />\r\n\r\n";
				$this->winnerExists = true;

				$winners=$this->findUniqueVotesLeft();
				for($i=0;$i<sizeof($winners);$i++){
					$this->addWinner($winners[$i]);
				}
				break;
			}
			else{
				echo "<h3>Round ". $this->rounds."</h3>\r\n";
				echo "Num of candidates left: " . $this->findNumOfUniqueVotesLeft() . "\r\n";
				$topVoteRound = $this->seeIfTopVoteGetterIsOverWinNum($this->votes);
				if(!$topVoteRound)
				{
					$this->conductRound();
					$this->increaseRound();
				}
				else{
					$this->winnerExists = true;
					break;
				}
			}
		}
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
